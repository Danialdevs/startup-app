import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET all classes for the current teacher
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const classes = await prisma.lPClass.findMany({
      where: { teacherId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { students: true } },
      },
    })

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

// POST create class
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const lpClass = await prisma.lPClass.create({
      data: {
        name: name.trim(),
        teacherId: session.userId,
      },
    })

    return NextResponse.json({ class: lpClass })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}
