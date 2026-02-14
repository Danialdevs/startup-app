import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

// POST student login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })
    }

    const student = await prisma.lPStudent.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { class: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }

    const isValid = await verifyPassword(password.trim(), student.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        className: student.class.name,
      },
    })
  } catch (error) {
    console.error('Student auth error:', error)
    return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 500 })
  }
}
