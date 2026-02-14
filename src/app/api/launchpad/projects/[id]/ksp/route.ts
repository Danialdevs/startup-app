import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildKspPrompt } from '@/lib/launchpad'
import OpenAI from 'openai'

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
const openai = apiKey
  ? new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' })
  : null

// POST generate KSP (super admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } })
    if (!user || user.isAdmin !== true) {
      return NextResponse.json({ error: 'Только суперадмин может генерировать КСП' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { language, subject, grade, topic, duration, teacherName, learningGoals } = body

    if (!topic?.trim() || !subject?.trim() || !grade?.trim()) {
      return NextResponse.json({ error: 'Topic, subject, and grade are required' }, { status: 400 })
    }

    const project = await prisma.lPProject.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const prompt = buildKspPrompt({
      language: language || 'ru',
      topic: topic.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      duration: duration || 45,
      teacherName: teacherName?.trim() || 'Учитель',
      learningGoals: learningGoals?.trim() || topic.trim(),
    })

    let content = ''

    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `Ты — опытный методист и учитель. Создаёшь подробные краткосрочные планы уроков (КСП). Отвечай ТОЛЬКО на языке, указанном в инструкции. Используй правильное markdown форматирование таблиц.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        })
        content = response.choices[0]?.message?.content || ''
      } catch (aiError) {
        console.error('AI generation error:', aiError)
        content = generateFallbackKsp(language || 'ru', topic, subject, grade, teacherName || 'Учитель', duration || 45)
      }
    } else {
      content = generateFallbackKsp(language || 'ru', topic, subject, grade, teacherName || 'Учитель', duration || 45)
    }

    const lessonPlan = await prisma.lPLessonPlan.create({
      data: {
        language: language || 'ru',
        subject,
        grade,
        topic,
        duration: duration || 45,
        content,
        projectId: id,
      },
    })

    return NextResponse.json({ lessonPlan })
  } catch (error) {
    console.error('Error generating KSP:', error)
    return NextResponse.json({ error: 'Failed to generate KSP' }, { status: 500 })
  }
}

function generateFallbackKsp(
  language: string,
  topic: string,
  subject: string,
  grade: string,
  teacherName: string,
  duration: number
): string {
  const date = new Date().toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU')
  const mid = duration - 14

  if (language === 'kz') {
    return `## **Қысқа мерзімді сабақ жоспары**

| Өріс | Мәлімет |
|------|---------|
| Педагогтің аты-жөні | ${teacherName} |
| Күні | ${date} |
| Сынып | ${grade} |
| Пән | ${subject} |
| Сабақтың тақырыбы | ${topic} |

## **Сабақтың барысы**

| Сабақтың кезеңі / Уақыт | Педагогтің әрекеті | Оқушының әрекеті | Бағалау | Ресурстар |
|---|---|---|---|---|
| Сабақтың басы (7 мин) | Ұйымдастыру, сұрақ-жауап | Жауап береді | Бағдаршам | Оқулық |
| Сабақтың ортасы (${mid} мин) | Тапсырмалар беру | Орындау | Дескрипторлар | Дәптер |
| Сабақтың соңы (7 мин) | Қорытындылау | Рефлексия | Бас бармақ | Стикерлер |`
  }

  return `## **Краткосрочный план урока**

| Поле | Значение |
|------|----------|
| ФИО педагога | ${teacherName} |
| Дата | ${date} |
| Класс | ${grade} |
| Предмет | ${subject} |
| Тема урока | ${topic} |

## **Ход урока**

| Этап урока / Время | Действия педагога | Действия учащихся | Оценивание | Ресурсы |
|---|---|---|---|---|
| Начало урока (7 мин) | Организационный момент, вопросы | Отвечают на вопросы | Светофор | Учебник |
| Середина урока (${mid} мин) | Объяснение, задания | Выполняют задания | Дескрипторы | Тетрадь |
| Конец урока (7 мин) | Подведение итогов | Рефлексия | Палец вверх | Стикеры |`
}
