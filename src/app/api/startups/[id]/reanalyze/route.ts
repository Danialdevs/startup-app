import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateComprehensiveAnalysis } from '@/lib/openai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    // Get startup with context
    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      include: {
        problemAnswers: true,
        ideaDetails: true
      }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Prepare startup context
    const answers: Record<string, string> = {}
    if (startup.problemAnswers) {
      startup.problemAnswers.forEach((pa: { questionId: string; answer: string }) => {
        answers[pa.questionId] = pa.answer
      })
    }

    // Generate comprehensive analysis with competitor search
    const analysis = await generateComprehensiveAnalysis(
      startup.name,
      startup.description || '',
      startup.problem || '',
      startup.idea || startup.ideaDetails?.description || '',
      startup.audience || startup.ideaDetails?.targetAudience || '',
      answers
    )

    // Update startup with new analysis
    await prisma.startup.update({
      where: { id },
      data: {
        analysis: JSON.stringify(analysis)
      }
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Reanalyze error:', error)
    return NextResponse.json({ 
      error: 'Failed to reanalyze startup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
