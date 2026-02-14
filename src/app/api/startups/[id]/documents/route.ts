import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

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

    const documents = await prisma.document.findMany({
      where: { startupId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Get documents error:', error)
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

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Неподдерживаемый тип файла' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Файл слишком большой (макс. 20МБ)' }, { status: 400 })
    }

    // Create uploads/documents directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const filepath = join(uploadsDir, fileName)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/documents/${fileName}`

    const document = await prisma.document.create({
      data: {
        name: name || file.name,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        startupId: id
      }
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Upload document error:', error)
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
    const { documentId, name } = await request.json()

    if (!documentId || !name) {
      return NextResponse.json({ error: 'Document ID and name required' }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: { name }
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Update document error:', error)
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
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const startup = await prisma.startup.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!startup || startup.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (document) {
      // Delete file from disk
      const filepath = join(process.cwd(), 'public', document.fileUrl)
      try {
        await unlink(filepath)
      } catch {
        // File may already be deleted
      }

      await prisma.document.delete({
        where: { id: documentId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
