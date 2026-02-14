import { NextRequest, NextResponse } from 'next/server'
import { getSession, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST add student to class
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
    const body = await request.json()
    const { name, email, password } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!password?.trim()) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Check email uniqueness
    const existing = await prisma.lPStudent.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Ученик с таким email уже существует' }, { status: 409 })
    }

    // Verify class ownership
    const lpClass = await prisma.lPClass.findFirst({
      where: { id, teacherId: session.userId },
    })

    if (!lpClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const hashedPassword = await hashPassword(password.trim())

    const student = await prisma.lPStudent.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        classId: id,
      },
    })

    // Return student with original (unhashed) password so teacher can share it
    return NextResponse.json({
      student: {
        ...student,
        plainPassword: password.trim(),
      }
    })
  } catch (error) {
    console.error('Error adding student:', error)
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 })
  }
}

// DELETE remove student
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify ownership via class
    const student = await prisma.lPStudent.findUnique({
      where: { id: studentId },
      include: { class: true },
    })

    if (!student || student.class.teacherId !== session.userId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    await prisma.lPStudent.delete({ where: { id: studentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing student:', error)
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 })
  }
}
