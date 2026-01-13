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
    const { title, description, targetAudience, uniqueValue } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Upsert idea
    const idea = await prisma.idea.upsert({
      where: { startupId: id },
      create: {
        startupId: id,
        title,
        description,
        targetAudience,
        uniqueValue
      },
      update: {
        title,
        description,
        targetAudience,
        uniqueValue
      }
    })

    // Update stage if moving forward
    if (startup.stage < 3) {
      await prisma.startup.update({
        where: { id },
        data: { stage: 3 }
      })
    }

    return NextResponse.json({ idea })
  } catch (error) {
    console.error('Save idea error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


