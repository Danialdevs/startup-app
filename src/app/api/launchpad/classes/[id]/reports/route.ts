import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET reports for a class — all student responses across all projects
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

    const lpClass = await prisma.lPClass.findFirst({
      where: { id, teacherId: session.userId },
      include: {
        students: {
          orderBy: { name: 'asc' },
          include: {
            responses: {
              include: { project: true },
              orderBy: { updatedAt: 'desc' },
            },
          },
        },
      },
    })

    if (!lpClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get all projects for completion tracking
    const allProjects = await prisma.lPProject.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, icon: true },
    })

    // Build report per student
    const report = lpClass.students.map((student) => {
      const completedProjectIds = student.responses.map((r) => r.projectId)
      return {
        student: { id: student.id, name: student.name },
        totalProjects: allProjects.length,
        completedProjects: completedProjectIds.length,
        completionPercent: allProjects.length > 0
          ? Math.round((completedProjectIds.length / allProjects.length) * 100)
          : 0,
        responses: student.responses.map((r) => ({
          projectId: r.projectId,
          projectName: r.project.name,
          projectIcon: r.project.icon,
          answers: JSON.parse(r.answers),
          updatedAt: r.updatedAt,
        })),
      }
    })

    return NextResponse.json({ report, projects: allProjects, className: lpClass.name })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
