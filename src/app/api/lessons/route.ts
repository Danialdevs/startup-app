import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth'

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

        // Get highest order
        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId: json.moduleId },
            orderBy: { order: 'desc' },
            select: { order: true }
        })

        const newOrder = (lastLesson?.order ?? -1) + 1

        const lesson = await prisma.lesson.create({
            data: {
                title: json.title,
                moduleId: json.moduleId,
                videoUrl: json.videoUrl,
                content: json.content,
                description: json.description,
                isFree: json.isFree || false,
                duration: json.duration,
                order: newOrder
            }
        })

        return NextResponse.json(lesson)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create lesson' },
            { status: 500 }
        )
    }
}
