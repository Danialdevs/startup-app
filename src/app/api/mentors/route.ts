import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/mentors - Get all mentors
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const expertise = searchParams.get('expertise')
        const search = searchParams.get('search')

        const where: Record<string, unknown> = {
            available: true,
        }

        if (expertise) {
            where.expertise = {
                contains: expertise,
            }
        }

        if (search) {
            where.user = {
                name: {
                    contains: search,
                },
            }
        }

        const mentors = await prisma.mentor.findMany({
            where,
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
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ mentors })
    } catch (error) {
        console.error('Error fetching mentors:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}

// POST /api/mentors - Become a mentor
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }
        const userId = session.userId

        // Check if already a mentor
        const existingMentor = await prisma.mentor.findUnique({
            where: { userId },
        })

        if (existingMentor) {
            return NextResponse.json({ error: 'Вы уже являетесь ментором' }, { status: 400 })
        }

        const body = await request.json()
        const { bio, expertise, experience, hourlyRate, linkedIn, telegram } = body

        if (!bio || !expertise) {
            return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
        }

        const mentor = await prisma.mentor.create({
            data: {
                userId,
                bio,
                expertise: JSON.stringify(expertise),
                experience: experience || 0,
                hourlyRate: hourlyRate || null,
                linkedIn: linkedIn || null,
                telegram: telegram || null,
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

        return NextResponse.json({ mentor }, { status: 201 })
    } catch (error) {
        console.error('Error creating mentor:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}
