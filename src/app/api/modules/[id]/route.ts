import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth'

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
        const module = await prisma.module.update({
            where: { id },
            data: {
                title: json.title,
                description: json.description,
                order: json.order
            }
        })

        return NextResponse.json(module)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update module' },
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
        await prisma.module.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete module' },
            { status: 500 }
        )
    }
}
