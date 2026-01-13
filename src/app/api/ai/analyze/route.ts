import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { analyzeStartupIdea } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { name, description, problem, idea, audience, answers } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Always returns analysis (AI or fallback)
    const analysis = await analyzeStartupIdea(name, description, problem, idea, audience, answers)

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('AI analyze error:', error)
    // Return basic analysis on error
    return NextResponse.json({
      analysis: {
        summary: 'Проект на начальном этапе. Продолжайте развивать идею.',
        suggestedName: 'Мой стартап',
        suggestedDescription: 'Инновационное решение',
        suggestedProblem: 'Опишите проблему',
        suggestedIdea: 'Опишите решение',
        strengths: ['Вы начали работу над проектом'],
        improvements: ['Изучите рынок', 'Определите конкурентов', 'Создайте MVP'],
        nextSteps: ['Исследование рынка', 'Прототипирование']
      }
    })
  }
}
