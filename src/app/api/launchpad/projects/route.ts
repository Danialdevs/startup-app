import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET all projects (any authenticated user)
export async function GET() {
  try {
    const projects = await prisma.lPProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { responses: true, lessonPlans: true } },
      },
    })
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST create project (super admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } })
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Только администратор может создавать проекты' }, { status: 403 })
    }

    const body = await request.json()
    const { name, icon, description } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const project = await prisma.lPProject.create({
      data: {
        name: name.trim(),
        icon: icon || '🚀',
        description: description?.trim() || null,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
