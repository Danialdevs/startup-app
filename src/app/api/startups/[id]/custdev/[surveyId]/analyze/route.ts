import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
const openai = apiKey ? new OpenAI({
  apiKey,
  baseURL: 'https://api.deepseek.com/v1',
}) : null

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
      select: { id: true, name: true, description: true, problem: true, audience: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const survey = await prisma.custDevSurvey.findUnique({
      where: { id: surveyId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        responses: {
          include: { answers: { include: { question: true } } }
        }
      }
    })

    if (!survey || survey.startupId !== id) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.responses.length === 0) {
      return NextResponse.json({ error: 'Нет ответов для анализа' }, { status: 400 })
    }

    // Format responses for AI
    const responsesText = survey.responses.map((r, i) => {
      const answersText = r.answers.map(a => {
        return `  ${a.question.text}: ${a.value}`
      }).join('\n')
      return `Респондент ${i + 1}${r.respondentName ? ` (${r.respondentName})` : ''}:\n${answersText}`
    }).join('\n\n')

    if (!openai) {
      const fallback = createFallbackAnalysis(survey.responses.length, survey.questions.length)
      await prisma.custDevSurvey.update({
        where: { id: surveyId },
        data: { aiAnalysis: JSON.stringify(fallback) }
      })
      return NextResponse.json({ analysis: fallback })
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Ты — аналитик Customer Development. Проанализируй ответы опроса и дай выводы.
Отвечай на русском языке. Будь конкретным и основывайся на данных.`
          },
          {
            role: 'user',
            content: `Стартап: ${startup.name}
Описание: ${startup.description || 'Не указано'}
Проблема: ${startup.problem || 'Не указано'}
Аудитория: ${startup.audience || 'Не указано'}

Ответы на опрос (${survey.responses.length} респондентов):

${responsesText}

Проанализируй ответы и верни JSON (без markdown):
{
  "summary": "Общий вывод по опросу (3-4 предложения)",
  "problemConfirmed": true/false,
  "problemConfidence": 75,
  "keyInsights": ["Инсайт 1", "Инсайт 2", "Инсайт 3"],
  "painPoints": ["Боль 1", "Боль 2"],
  "opportunities": ["Возможность 1", "Возможность 2"],
  "risks": ["Риск 1", "Риск 2"],
  "recommendations": ["Рекомендация 1", "Рекомендация 2", "Рекомендация 3"],
  "audienceSegments": [
    {"name": "Сегмент 1", "percent": 60, "description": "Описание"},
    {"name": "Сегмент 2", "percent": 40, "description": "Описание"}
  ],
  "nextSteps": ["Шаг 1", "Шаг 2", "Шаг 3"],
  "overallScore": 75,
  "verdict": "Краткий вердикт одним предложением"
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : createFallbackAnalysis(survey.responses.length, survey.questions.length)

      // Save analysis
      await prisma.custDevSurvey.update({
        where: { id: surveyId },
        data: { aiAnalysis: JSON.stringify(analysis) }
      })

      return NextResponse.json({ analysis })
    } catch (aiError) {
      console.error('AI analysis error:', aiError)
      const fallback = createFallbackAnalysis(survey.responses.length, survey.questions.length)
      return NextResponse.json({ analysis: fallback })
    }
  } catch (error) {
    console.error('Analyze survey error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function createFallbackAnalysis(responseCount: number, questionCount: number) {
  return {
    summary: `Получено ${responseCount} ответов на ${questionCount} вопросов. Требуется больше данных для надёжных выводов.`,
    problemConfirmed: responseCount >= 3,
    problemConfidence: Math.min(responseCount * 15, 80),
    keyInsights: [
      'Необходимо больше респондентов для достоверного анализа',
      'Рекомендуется провести глубинные интервью',
    ],
    painPoints: ['Недостаточно данных для выявления болей'],
    opportunities: ['Продолжить сбор ответов для выявления возможностей'],
    risks: ['Малая выборка может давать искажённые результаты'],
    recommendations: [
      'Увеличить число респондентов минимум до 20',
      'Добавить открытые вопросы для качественного анализа',
      'Провести 5-10 глубинных интервью',
    ],
    audienceSegments: [],
    nextSteps: ['Собрать больше ответов', 'Провести интервью', 'Обновить гипотезу'],
    overallScore: Math.min(responseCount * 10, 60),
    verdict: 'Недостаточно данных — продолжайте сбор ответов.',
  }
}
