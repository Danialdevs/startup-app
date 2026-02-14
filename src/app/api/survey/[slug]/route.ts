import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public endpoint - no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const survey = await prisma.custDevSurvey.findUnique({
      where: { slug },
      include: {
        questions: { orderBy: { order: 'asc' } },
        startup: { select: { name: true } },
      }
    })

    if (!survey || !survey.isPublished) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        startupName: survey.startup.name,
        questions: survey.questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options ? JSON.parse(q.options) : null,
          required: q.required,
        })),
      }
    })
  } catch (error) {
    console.error('Get public survey error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Submit response - no auth required
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { respondentName, respondentEmail, answers } = await request.json()

    const survey = await prisma.custDevSurvey.findUnique({
      where: { slug },
      include: { questions: true }
    })

    if (!survey || !survey.isPublished) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers required' }, { status: 400 })
    }

    // Create response with answers
    const response = await prisma.custDevResponse.create({
      data: {
        surveyId: survey.id,
        respondentName: respondentName || null,
        respondentEmail: respondentEmail || null,
        answers: {
          create: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value: typeof value === 'string' ? value : JSON.stringify(value),
          }))
        }
      },
      include: { answers: true }
    })

    return NextResponse.json({ success: true, responseId: response.id })
  } catch (error) {
    console.error('Submit response error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
