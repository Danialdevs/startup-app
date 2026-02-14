import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET single class with students
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
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } })
    const isAdmin = user?.isAdmin === true

    const lpClass = await prisma.lPClass.findFirst({
      where: isAdmin ? { id } : { id, teacherId: session.userId },
      include: {
        students: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            classId: true,
            _count: { select: { responses: true } },
          },
        },
      },
    })

    if (!lpClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    return NextResponse.json({ class: lpClass })
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 })
  }
}

// DELETE class
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
    const lpClass = await prisma.lPClass.findFirst({
      where: { id, teacherId: session.userId },
    })

    if (!lpClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    await prisma.lPClass.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
  }
}
