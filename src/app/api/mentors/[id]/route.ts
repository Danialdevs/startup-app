import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/mentors/[id] - Get mentor by id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const mentor = await prisma.mentor.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        })

        if (!mentor) {
            return NextResponse.json({ error: 'Ментор не найден' }, { status: 404 })
        }

        return NextResponse.json({ mentor })
    } catch (error) {
        console.error('Error fetching mentor:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// PUT /api/mentors/[id] - Update mentor profile
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id } = await params

        // Check ownership
        const mentor = await prisma.mentor.findUnique({
            where: { id },
        })

        if (!mentor) {
            return NextResponse.json({ error: 'Ментор не найден' }, { status: 404 })
        }

        if (mentor.userId !== session.userId) {
            return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
        }

        const body = await request.json()
        const { bio, expertise, experience, hourlyRate, linkedIn, telegram, available } = body

        const updatedMentor = await prisma.mentor.update({
            where: { id },
            data: {
                bio: bio !== undefined ? bio : undefined,
                expertise: expertise !== undefined ? JSON.stringify(expertise) : undefined,
                experience: experience !== undefined ? experience : undefined,
                hourlyRate: hourlyRate !== undefined ? hourlyRate : undefined,
                linkedIn: linkedIn !== undefined ? linkedIn : undefined,
                telegram: telegram !== undefined ? telegram : undefined,
                available: available !== undefined ? available : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({ mentor: updatedMentor })
    } catch (error) {
        console.error('Error updating mentor:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// DELETE /api/mentors/[id] - Delete mentor profile (owner or admin)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id } = await params

        // Check ownership or admin
        const mentor = await prisma.mentor.findUnique({
            where: { id },
        })

        if (!mentor) {
            return NextResponse.json({ error: 'Ментор не найден' }, { status: 404 })
        }

        // Allow if owner OR admin
        const user = await prisma.user.findUnique({ where: { id: session.userId } })
        if (mentor.userId !== session.userId && !user?.isAdmin) {
            return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
        }

        await prisma.mentor.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting mentor:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}
