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
    const { title, description, priority } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Update stage to MVP if needed
    if (startup.stage < 4) {
      await prisma.startup.update({
        where: { id },
        data: { stage: 4 }
      })
    }

    const feature = await prisma.mvpFeature.create({
      data: {
        startupId: id,
        title,
        description,
        priority: priority || 0
      }
    })

    return NextResponse.json({ feature })
  } catch (error) {
    console.error('Create MVP feature error:', error)
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
    const { featureId, ...data } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    const feature = await prisma.mvpFeature.update({
      where: { id: featureId },
      data
    })

    return NextResponse.json({ feature })
  } catch (error) {
    console.error('Update MVP feature error:', error)
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
    const { featureId } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    await prisma.mvpFeature.delete({
      where: { id: featureId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete MVP feature error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


