import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getUser()
        // Optional: Filter courses based on user subscription or other logic
        // For now, return all published courses, or all courses if admin

        // Admin sees all, others see only published
        const where = user?.isAdmin ? {} : { published: true }

        // Debugging: Log available models if course is missing
        if (!(prisma as any).course) {
            console.error('Prisma models available:', Object.keys(prisma))
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                _count: {
                    select: { modules: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(courses)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getUser()
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const json = await request.json()
        const course = await prisma.course.create({
            data: {
                title: json.title,
                description: json.description,
                image: json.image,
                published: json.published || false
            }
        })

        return NextResponse.json(course)
    } catch (error) {
        console.error('Error creating course:', error)
        return NextResponse.json(
            { error: 'Failed to create course', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
