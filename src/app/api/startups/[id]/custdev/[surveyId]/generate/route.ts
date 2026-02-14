import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
const openai = apiKey ? new OpenAI({
  apiKey,
  baseURL: 'https://api.deepseek.com/v1',
}) : null

const FALLBACK_QUESTIONS = [
  { text: 'С какой основной проблемой вы сталкиваетесь в этой области?', type: 'text' },
  { text: 'Как вы сейчас решаете эту проблему?', type: 'text' },
  { text: 'Насколько вас устраивает текущее решение?', type: 'rating' },
  { text: 'Готовы ли вы платить за более удобное решение?', type: 'single_choice', options: ['Да, определённо', 'Скорее да', 'Не уверен(а)', 'Скорее нет', 'Нет'] },
  { text: 'Какие функции для вас наиболее важны?', type: 'multiple_choice', options: ['Простота использования', 'Скорость', 'Цена', 'Интеграции', 'Поддержка', 'Безопасность'] },
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; surveyId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id, surveyId } = await params

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      select: { id: true, name: true, description: true, problem: true, audience: true, idea: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const survey = await prisma.custDevSurvey.findUnique({
      where: { id: surveyId },
      select: { title: true, description: true }
    })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (!openai) {
      return NextResponse.json({ questions: FALLBACK_QUESTIONS })
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Ты — эксперт по Customer Development. Создай вопросы для опроса целевой аудитории стартапа.
Вопросы должны помочь понять:
- Существует ли проблема
- Как люди решают её сейчас
- Готовы ли они платить за решение
- Какие функции важны

Отвечай на русском языке.`
          },
          {
            role: 'user',
            content: `Стартап: ${startup.name}
Описание: ${startup.description || 'Не указано'}
Проблема: ${startup.problem || 'Не указано'}
Решение: ${startup.idea || 'Не указано'}
Аудитория: ${startup.audience || 'Не указано'}
Название опроса: ${survey.title}
${survey.description ? `Описание опроса: ${survey.description}` : ''}

Создай 6-8 вопросов для CustDev опроса. Используй разные типы вопросов.

Верни ТОЛЬКО JSON массив (без markdown):
[
  {"text": "Вопрос?", "type": "text"},
  {"text": "Вопрос?", "type": "single_choice", "options": ["Вариант 1", "Вариант 2", "Вариант 3"]},
  {"text": "Вопрос?", "type": "multiple_choice", "options": ["Вариант 1", "Вариант 2", "Вариант 3"]},
  {"text": "Оцените от 1 до 5?", "type": "rating"}
]

Типы: text (свободный текст), single_choice (один вариант), multiple_choice (несколько вариантов), rating (оценка 1-5)`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content || '[]'
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : FALLBACK_QUESTIONS

      return NextResponse.json({ questions })
    } catch (aiError) {
      console.error('AI generation error:', aiError)
      return NextResponse.json({ questions: FALLBACK_QUESTIONS })
    }
  } catch (error) {
    console.error('Generate questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
