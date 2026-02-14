import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
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
      select: { id: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const survey = await prisma.custDevSurvey.findUnique({
      where: { id: surveyId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        responses: {
          include: {
            answers: { include: { question: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { responses: true } }
      }
    })

    if (!survey || survey.startupId !== id) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Get survey error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; surveyId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id, surveyId } = await params
    const body = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      select: { id: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Handle questions update
    if (body.questions) {
      // Delete existing questions
      await prisma.custDevQuestion.deleteMany({ where: { surveyId } })

      // Create new questions
      if (body.questions.length > 0) {
        await prisma.custDevQuestion.createMany({
          data: body.questions.map((q: { text: string; type: string; options?: string[]; required?: boolean }, i: number) => ({
            surveyId,
            text: q.text,
            type: q.type,
            options: q.options ? JSON.stringify(q.options) : null,
            order: i,
            required: q.required ?? true,
          }))
        })
      }
    }

    // Handle survey metadata update
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished

    if (Object.keys(updateData).length > 0) {
      await prisma.custDevSurvey.update({
        where: { id: surveyId },
        data: updateData
      })
    }

    // Return updated survey
    const survey = await prisma.custDevSurvey.findUnique({
      where: { id: surveyId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } }
      }
    })

    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Update survey error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
