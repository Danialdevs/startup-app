import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

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

    console.log('Fetching startup:', id, 'for user:', session.userId)
    
    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      select: {
        id: true,
        name: true,
        description: true,
        problem: true,
        idea: true,
        audience: true,
        analysis: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        problemAnswers: true,
        ideaDetails: true,
        teamMembers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignees: {
              include: {
                member: true
              }
            }
          }
        },
        mvpFeatures: {
          orderBy: { priority: 'asc' }
        }
      }
    })

    if (!startup) {
      console.log('Startup not found for id:', id, 'ownerId:', session.userId)
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    console.log('Startup found:', startup.name)
    return NextResponse.json({ startup })
  } catch (error) {
    console.error('Get startup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    const updated = await prisma.startup.update({
      where: { id },
      data
    })

    return NextResponse.json({ startup: updated })
  } catch (error) {
    console.error('Update startup error:', error)
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

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    await prisma.startup.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete startup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

