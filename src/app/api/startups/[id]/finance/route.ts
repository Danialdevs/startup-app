import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const transactions = await prisma.transaction.findMany({
      where: { startupId: id },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { type, amount, category, description, date } = await request.json()

    if (!type || !amount || !category) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        startupId: id
      }
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Create transaction error:', error)
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
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

