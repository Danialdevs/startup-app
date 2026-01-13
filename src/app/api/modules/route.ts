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

        // Get highest order to append to the end
        const lastModule = await prisma.module.findFirst({
            where: { courseId: json.courseId },
            orderBy: { order: 'desc' },
            select: { order: true }
        })

        const newOrder = (lastModule?.order ?? -1) + 1

        const module = await prisma.module.create({
            data: {
                title: json.title,
                description: json.description,
                courseId: json.courseId,
                order: newOrder
            }
        })

        return NextResponse.json(module)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create module' },
            { status: 500 }
        )
    }
}
