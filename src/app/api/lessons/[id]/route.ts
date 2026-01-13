import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const lesson = await prisma.lesson.findUnique({
            where: { id },
            include: {
                module: {
                    include: {
                        course: true
                    }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(lesson)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch lesson' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser()
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        const json = await request.json()
        const lesson = await prisma.lesson.update({
            where: { id },
            data: {
                title: json.title,
                videoUrl: json.videoUrl,
                content: json.content,
                description: json.description,
                isFree: json.isFree,
                duration: json.duration,
                order: json.order
            }
        })

        return NextResponse.json(lesson)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update lesson' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser()
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        await prisma.lesson.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete lesson' },
            { status: 500 }
        )
    }
}
