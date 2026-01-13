import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/opportunities/[id] - Get opportunity by id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const opportunity = await prisma.opportunity.findUnique({
            where: { id },
        })

        if (!opportunity) {
            return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
        }

        return NextResponse.json({ opportunity })
    } catch (error) {
        console.error('Error fetching opportunity:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// DELETE /api/opportunities/[id] - Delete opportunity (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({ where: { id: session.userId } })
        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
        }

        const { id } = await params

        const opportunity = await prisma.opportunity.findUnique({ where: { id } })
        if (!opportunity) {
            return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
        }

        await prisma.opportunity.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting opportunity:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}
