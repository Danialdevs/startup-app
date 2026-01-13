import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/opportunities - Get all opportunities
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const category = searchParams.get('category')
        const search = searchParams.get('search')

        const where: Record<string, unknown> = {
            active: true,
        }

        if (type) {
            where.type = type
        }

        if (category) {
            where.categories = {
                contains: category,
            }
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { organization: { contains: search } },
                { description: { contains: search } },
            ]
        }

        const opportunities = await prisma.opportunity.findMany({
            where,
            orderBy: [
                { deadline: 'asc' },
                { createdAt: 'desc' },
            ],
        })

        return NextResponse.json({ opportunities })
    } catch (error) {
        console.error('Error fetching opportunities:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// POST /api/opportunities - Create new opportunity (admin only)
export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { title, description, type, organization, amount, deadline, link, eligibility, categories, country } = body

        if (!title || !description || !type || !organization || !categories) {
            return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
        }

        const opportunity = await prisma.opportunity.create({
            data: {
                title,
                description,
                type,
                organization,
                amount: amount || null,
                deadline: deadline ? new Date(deadline) : null,
                link: link || null,
                eligibility: eligibility || null,
                categories: JSON.stringify(categories),
                country: country || null,
            },
        })

        return NextResponse.json({ opportunity }, { status: 201 })
    } catch (error) {
        console.error('Error creating opportunity:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}
