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
    const { title, description, status, priority, dueDate, assigneeIds } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    const task = await prisma.task.create({
      data: {
        startupId: id,
        title,
        description: description || null,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignees: assigneeIds?.length > 0 ? {
          create: assigneeIds.map((memberId: string) => ({
            memberId
          }))
        } : undefined
      },
      include: {
        assignees: {
          include: {
            member: true
          }
        }
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Create task error:', error)
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
    const { taskId, assigneeIds, ...data } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate)
    }

    // Update task data
    const task = await prisma.task.update({
      where: { id: taskId },
      data
    })

    // Update assignees if provided
    if (assigneeIds !== undefined) {
      // Remove all current assignees
      await prisma.taskAssignee.deleteMany({
        where: { taskId }
      })

      // Add new assignees
      if (assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((memberId: string) => ({
            taskId,
            memberId
          }))
        })
      }
    }

    // Fetch updated task with assignees
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: {
            member: true
          }
        }
      }
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('Update task error:', error)
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
    const { taskId } = await request.json()

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
