import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const { name, email, role, skills } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Check if user exists with this email
    const existingUser = email ? await prisma.user.findUnique({
      where: { email }
    }) : null

    const member = await prisma.teamMember.create({
      data: {
        startupId: id,
        name: existingUser?.name || name,
        email: email || null,
        role,
        skills,
        userId: existingUser?.id || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Add team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const { memberId, name, email, role, skills } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: { name, email, role, skills }
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Update team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const { memberId } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    await prisma.teamMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

