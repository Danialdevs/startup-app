import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET student's response for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; projectId: string }> }
) {
  try {
    const { studentId, projectId } = await params

    const student = await prisma.lPStudent.findUnique({
      where: { id: studentId },
      include: { class: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const project = await prisma.lPProject.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const response = await prisma.lPProjectResponse.findUnique({
      where: { projectId_studentId: { projectId, studentId } },
    })

    return NextResponse.json({
      student: { id: student.id, name: student.name, className: student.class.name },
      project,
      answers: response ? JSON.parse(response.answers) : null,
    })
  } catch (error) {
    console.error('Error fetching student project:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// POST/PUT save student answers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; projectId: string }> }
) {
  try {
    const { studentId, projectId } = await params
    const body = await request.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    // Verify student and project exist
    const [student, project] = await Promise.all([
      prisma.lPStudent.findUnique({ where: { id: studentId } }),
      prisma.lPProject.findUnique({ where: { id: projectId } }),
    ])

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Upsert the response
    const response = await prisma.lPProjectResponse.upsert({
      where: { projectId_studentId: { projectId, studentId } },
      create: {
        projectId,
        studentId,
        answers: JSON.stringify(answers),
      },
      update: {
        answers: JSON.stringify(answers),
      },
    })

    return NextResponse.json({ success: true, response })
  } catch (error) {
    console.error('Error saving answers:', error)
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
  }
}
