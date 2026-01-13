import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

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
    const { answers } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Delete existing answers and create new ones
    await prisma.problemAnswer.deleteMany({
      where: { startupId: id }
    })

    const createdAnswers = await Promise.all(
      Object.entries(answers).map(([questionId, answer]) =>
        prisma.problemAnswer.create({
          data: {
            startupId: id,
            questionId,
            answer: answer as string
          }
        })
      )
    )

    // Update stage if moving forward
    if (startup.stage < 2) {
      await prisma.startup.update({
        where: { id },
        data: { stage: 2 }
      })
    }

    return NextResponse.json({ answers: createdAnswers })
  } catch (error) {
    console.error('Save problem answers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


