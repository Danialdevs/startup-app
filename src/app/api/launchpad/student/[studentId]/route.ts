import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET student info + all projects with completion status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params

    const student = await prisma.lPStudent.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        responses: { select: { projectId: true } },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const projects = await prisma.lPProject.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const completedIds = new Set(student.responses.map((r) => r.projectId))

    const projectsWithStatus = projects.map((p) => ({
      ...p,
      completed: completedIds.has(p.id),
    }))

    return NextResponse.json({
      student: { id: student.id, name: student.name, className: student.class.name },
      projects: projectsWithStatus,
    })
  } catch (error) {
    console.error('Error fetching student data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
