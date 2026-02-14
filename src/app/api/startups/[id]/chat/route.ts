import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { chatWithStartup } from '@/lib/openai'
import { extractDocumentsContext } from '@/lib/documentExtractor'

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

    // Verify startup ownership first
    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      select: { id: true }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Get chat history
    const chatMessages = await prisma.chatMessage.findMany({
      where: { 
        startupId: id
      },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
        createdAt: true
      }
    })

    return NextResponse.json({ messages: chatMessages })
  } catch (error) {
    console.error('Chat history error:', error)
    return NextResponse.json({ error: 'Failed to load chat history', messages: [] }, { status: 500 })
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
    const body = await request.json()
    const { message, messages } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Get startup with context and documents
    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      include: {
        problemAnswers: true,
        ideaDetails: true,
        documents: {
          select: {
            id: true,
            name: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            fileType: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to 10 most recent documents
        }
      }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Prepare startup context
    const answers: Record<string, string> = {}
    if (startup.problemAnswers) {
      startup.problemAnswers.forEach((pa: { questionId: string; answer: string }) => {
        answers[pa.questionId] = pa.answer
      })
    }

    // Extract text content from uploaded documents (RAG)
    let documentsContext = ''
    if (startup.documents && startup.documents.length > 0) {
      console.log(`Extracting text from ${startup.documents.length} documents for RAG...`)
      documentsContext = await extractDocumentsContext(startup.documents)
      console.log(`Documents context length: ${documentsContext.length} chars`)
    }

    const startupContext = {
      name: startup.name,
      description: startup.description || '',
      problem: startup.problem || '',
      idea: startup.idea || startup.ideaDetails?.description || '',
      audience: startup.audience || startup.ideaDetails?.targetAudience || '',
      answers,
      documentsContext,
    }

    // Get last user message (the new one being sent)
    const lastUserMessage = messages[messages.length - 1]
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
    }

    // Get recent messages BEFORE saving new one (to avoid including it twice)
    let contextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    try {
      const recentMessagesBefore = await prisma.chatMessage.findMany({
        where: { startupId: id },
        orderBy: { createdAt: 'desc' },
        take: 2, // Get last 2 messages (before adding new user message)
        select: {
          role: true,
          content: true
        }
      })

      // Reverse to get chronological order
      contextMessages = recentMessagesBefore.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    } catch (dbError) {
      console.error('Error fetching recent messages:', dbError)
      // Continue with empty context if there's an error
    }

    // Add the new user message to context
    contextMessages.push({
      role: 'user',
      content: lastUserMessage.content
    })

    // Save user message to database
    try {
      await prisma.chatMessage.create({
        data: {
          role: 'user',
          content: lastUserMessage.content,
          startupId: id
        }
      })
    } catch (dbError) {
      console.error('Error saving user message:', dbError)
      // Continue even if saving fails
    }

    // Get AI response with minimal context
    console.log('=== Chat API Route ===')
    console.log('Startup:', startupContext.name)
    console.log('Context messages count:', contextMessages.length)
    console.log('Calling chatWithStartup...')
    
    const response = await chatWithStartup(startupContext, contextMessages)

    // Save assistant response to database
    if (response && typeof response === 'string') {
      try {
        await prisma.chatMessage.create({
          data: {
            role: 'assistant',
            content: response,
            startupId: id
          }
        })
      } catch (dbError) {
        console.error('Error saving assistant message:', dbError)
        // Continue even if saving fails - response is still valid
      }
    }

    console.log('Chat response received')
    console.log('Response type:', typeof response)
    console.log('Response length:', response?.length || 0)
    console.log('Response preview:', response?.substring(0, 100) || 'N/A')

    if (!response) {
      console.error('ERROR: Null response from chatWithStartup')
      return NextResponse.json({ 
        error: 'Null response from AI',
        response: 'Извините, не получил ответ от AI. Попробуйте еще раз.'
      }, { status: 500 })
    }

    if (typeof response !== 'string') {
      console.error('ERROR: Response is not a string:', typeof response)
      return NextResponse.json({ 
        error: 'Invalid response type from AI',
        response: 'Извините, получил неверный ответ от AI. Попробуйте еще раз.'
      }, { status: 500 })
    }

    if (response.trim().length === 0) {
      console.error('ERROR: Empty response from chatWithStartup')
      return NextResponse.json({ 
        error: 'Empty response from AI',
        response: 'Извините, не получил ответ от AI. Попробуйте еще раз.'
      }, { status: 500 })
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('=== Chat API Route Error ===')
    console.error('Error:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json({ 
      error: 'Failed to get chat response',
      response: 'Произошла ошибка при обработке запроса. Попробуйте еще раз.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
