import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateBusinessPlan } from '@/lib/openai'

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

    // Get startup with context
    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      include: {
        problemAnswers: true,
        ideaDetails: true
      }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    // Parse analysis if exists
    let analysis = null
    if (startup.analysis) {
      try {
        analysis = JSON.parse(startup.analysis)
      } catch {
        console.error('Failed to parse analysis')
      }
    }

    // Generate business plan
    const businessPlan = await generateBusinessPlan(
      startup.name,
      startup.description || '',
      startup.problem || '',
      startup.idea || startup.ideaDetails?.description || '',
      startup.audience || startup.ideaDetails?.targetAudience || '',
      analysis
    )

    if (!businessPlan) {
      return NextResponse.json({ 
        error: 'Failed to generate business plan',
        businessPlan: null
      }, { status: 500 })
    }

    return NextResponse.json({ businessPlan })
  } catch (error) {
    console.error('Business plan generation error:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json({ 
      error: 'Failed to generate business plan',
      businessPlan: null
    }, { status: 500 })
  }
}
