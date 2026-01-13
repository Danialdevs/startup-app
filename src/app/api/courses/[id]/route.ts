import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                modules: {
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(course)
    } catch (error) {
        console.error('Failed to fetch course:', error)
        return NextResponse.json(
            { error: 'Failed to fetch course' },
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
        const course = await prisma.course.update({
            where: { id },
            data: {
                title: json.title,
                description: json.description,
                image: json.image,
                published: json.published
            }
        })

        return NextResponse.json(course)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update course' },
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
        await prisma.course.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete course' },
            { status: 500 }
        )
    }
}
