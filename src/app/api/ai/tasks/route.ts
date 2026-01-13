import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { suggestTasks } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { name, description, idea, existingTasks } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Always returns tasks (AI or fallback)
    const tasks = await suggestTasks(name, description, idea, existingTasks || [])

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('AI tasks error:', error)
    // Return default tasks on error
    return NextResponse.json({ 
      tasks: [
        { title: 'Исследование рынка', description: 'Изучить конкурентов', priority: 'high' },
        { title: 'MVP план', description: 'Определить функционал', priority: 'high' },
        { title: 'Прототип', description: 'Создать первую версию', priority: 'medium' },
      ]
    })
  }
}
