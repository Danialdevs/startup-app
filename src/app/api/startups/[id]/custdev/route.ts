import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

function generateSlug() {
  return Math.random().toString(36).substring(2, 10)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      select: { id: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const surveys = await prisma.custDevSurvey.findMany({
      where: { startupId: id },
      include: {
        _count: { select: { questions: true, responses: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ surveys })
  } catch (error) {
    console.error('Get surveys error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { title, description } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      select: { id: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const survey = await prisma.custDevSurvey.create({
      data: {
        title,
        description: description || null,
        slug: generateSlug(),
        startupId: id,
      },
      include: {
        _count: { select: { questions: true, responses: true } }
      }
    })

    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Create survey error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const { surveyId } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      select: { id: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.custDevSurvey.delete({ where: { id: surveyId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete survey error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
