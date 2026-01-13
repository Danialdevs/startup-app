import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY

  console.log('=== Testing DeepSeek Chat API ===')
  console.log('API Key exists:', !!apiKey)
  console.log('API Key prefix:', apiKey?.substring(0, 15) + '...' || 'N/A')
  console.log('API Key length:', apiKey?.length || 0)
  console.log('API Provider: DeepSeek')

  if (!apiKey) {
    return NextResponse.json({ 
      error: 'No API key found',
      envKeys: Object.keys(process.env).filter(k => k.includes('DEEPSEEK') || k.includes('OPENAI'))
    }, { status: 500 })
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    })

    console.log('Calling DeepSeek API...')
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello" in Russian' }
      ],
      max_tokens: 50,
    })

    const content = response.choices[0]?.message?.content

    console.log('Success! Response:', content)

    return NextResponse.json({ 
      success: true,
      response: content,
      keyPrefix: apiKey.substring(0, 15) + '...'
    })
  } catch (error: unknown) {
    console.error('OpenAI test error:', error)
    
    let errorDetails: Record<string, unknown> = {}
    if (error && typeof error === 'object') {
      const err = error as { status?: number; code?: string; message?: string; response?: { status?: number; data?: unknown; error?: { message?: string; code?: string; type?: string } } }
      
      errorDetails = {
        status: err.status,
        code: err.code,
        message: err.message,
        responseStatus: err.response?.status,
        responseError: err.response?.error
      }

      console.error('Error details:', errorDetails)
    }

    return NextResponse.json({ 
      error: 'API call failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      keyPrefix: apiKey.substring(0, 15) + '...',
      errorDetails
    }, { status: 500 })
  }
}
