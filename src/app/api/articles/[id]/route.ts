import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

interface JWTPayload {
    userId: string
}

async function getUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null
    try {
        const payload = verify(token, JWT_SECRET) as JWTPayload
        return prisma.user.findUnique({ where: { id: payload.userId } })
    } catch {
        return null
    }
}

// GET /api/articles/[id] - Get article by id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        })

        if (!article) {
            return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 })
        }

        return NextResponse.json({ article })
    } catch (error) {
        console.error('Error fetching article:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// PUT /api/articles/[id] - Update article (admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        if (!user.isAdmin) {
            return NextResponse.json({ error: 'Только для администраторов' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { title, excerpt, content, image, published } = body

        const article = await prisma.article.update({
            where: { id },
            data: {
                title: title !== undefined ? title : undefined,
                excerpt: excerpt !== undefined ? excerpt : undefined,
                content: content !== undefined ? content : undefined,
                image: image !== undefined ? image : undefined,
                published: published !== undefined ? published : undefined,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({ article })
    } catch (error) {
        console.error('Error updating article:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// DELETE /api/articles/[id] - Delete article (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        if (!user.isAdmin) {
            return NextResponse.json({ error: 'Только для администраторов' }, { status: 403 })
        }

        const { id } = await params

        await prisma.article.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting article:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}
