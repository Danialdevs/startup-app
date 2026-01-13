import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateComprehensiveAnalysis } from '@/lib/openai'

export async function POST(request: NextRequest) {
  console.log('=== Comprehensive Analysis API called ===')
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
  console.log('OPENAI_API_KEY prefix:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...')
  
  try {
    const session = await getSession()
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, problem, idea, audience, answers } = body
    
    console.log('Request data:', { name, description: description?.substring(0, 50), problem: problem?.substring(0, 50) })

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    console.log('Calling generateComprehensiveAnalysis...')
    const analysis = await generateComprehensiveAnalysis(
      name,
      description || '',
      problem || '',
      idea || '',
      audience || '',
      answers || {}
    )

    console.log('Analysis generated successfully, keys:', Object.keys(analysis))
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Comprehensive analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

