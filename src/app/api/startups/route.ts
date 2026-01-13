import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const startups = await prisma.startup.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            teamMembers: true,
            tasks: true,
            mvpFeatures: true
          }
        }
      }
    })

    return NextResponse.json({ startups })
  } catch (error) {
    console.error('Get startups error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { name, description, problem, idea, audience, analysis } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const startup = await prisma.startup.create({
      data: {
        name,
        description,
        problem,
        idea,
        audience,
        analysis: analysis ? JSON.stringify(analysis) : null,
        ownerId: session.userId
      }
    })

    return NextResponse.json({ startup })
  } catch (error) {
    console.error('Create startup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


