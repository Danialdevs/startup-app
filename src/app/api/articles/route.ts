import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/articles - Get all published general articles
export async function GET() {
    try {
        const articles = await prisma.article.findMany({
            where: {
                published: true,
                startupId: null, // Only general articles (not tied to a startup)
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
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ articles })
    } catch (error) {
        console.error('Error fetching articles:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// POST /api/articles - Create new article (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({ where: { id: session.userId } })
        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Только для администраторов' }, { status: 403 })
        }

        const body = await request.json()
        const { title, excerpt, content, image, published } = body

        if (!title || !content) {
            return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
        }

        const article = await prisma.article.create({
            data: {
                title,
                excerpt: excerpt || null,
                content,
                image: image || null,
                published: published || false,
                authorId: user.id,
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

        return NextResponse.json({ article }, { status: 201 })
    } catch (error) {
        console.error('Error creating article:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}
