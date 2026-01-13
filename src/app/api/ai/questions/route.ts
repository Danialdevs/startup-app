import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getStartupQuestions } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { name, description, audience, problem } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Always returns questions (AI or fallback)
    const questions = await getStartupQuestions(name, description, audience, problem)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('AI questions error:', error)
    // Return default questions on error
    return NextResponse.json({ 
      questions: [
        'Какие конкуренты уже есть на рынке?',
        'Как вы планируете монетизировать продукт?',
        'Какие ресурсы нужны для запуска?'
      ]
    })
  }
}
