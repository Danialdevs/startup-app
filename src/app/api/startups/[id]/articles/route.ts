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

    const articles = await prisma.article.findMany({
      where: { startupId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Get articles error:', error)
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
    const { title, excerpt, content, image } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const article = await prisma.article.create({
      data: {
        title,
        excerpt: excerpt || null,
        content,
        image: image || null,
        startupId: id
      }
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Create article error:', error)
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
    const { articleId, ...data } = await request.json()

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Update article error:', error)
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
    const { articleId } = await request.json()

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.article.delete({
      where: { id: articleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


