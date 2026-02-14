import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET single project with responses (teacher sees only their students' responses)
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

    const project = await prisma.lPProject.findUnique({
      where: { id },
      include: {
        responses: {
          where: isAdmin
            ? undefined
            : { student: { class: { teacherId: session.userId } } },
          include: {
            student: { include: { class: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        lessonPlans: { orderBy: { createdAt: 'desc' } },
        _count: { select: { responses: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PATCH update project (super admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } })
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Только администратор может редактировать проекты' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, icon, description } = body

    const project = await prisma.lPProject.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(icon !== undefined && { icon }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE project (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } })
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Только администратор может удалять проекты' }, { status: 403 })
    }

    const { id } = await params
    await prisma.lPProject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
