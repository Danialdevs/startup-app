import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { chatWithStartup } from '@/lib/openai'

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

    // Get startup context
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

    // Get all active opportunities
    const allOpportunities = await prisma.opportunity.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    })

    if (allOpportunities.length === 0) {
      return NextResponse.json({ 
        learning: [],
        funding: []
      })
    }

    // Prepare startup context for AI
    const answers: Record<string, string> = {}
    if (startup.problemAnswers) {
      startup.problemAnswers.forEach((pa: { questionId: string; answer: string }) => {
        answers[pa.questionId] = pa.answer
      })
    }

    const startupContext = {
      name: startup.name,
      description: startup.description || '',
      problem: startup.problem || '',
      idea: startup.idea || startup.ideaDetails?.description || '',
      audience: startup.audience || startup.ideaDetails?.targetAudience || '',
      answers
    }

    // Format opportunities for AI
    const opportunitiesText = allOpportunities.map((opp, i) => {
      const categories = opp.categories ? JSON.parse(opp.categories) : []
      return `${i + 1}. ${opp.title} (${opp.organization})
Тип: ${opp.type}
${opp.description}
${opp.amount ? `Финансирование: ${opp.amount}` : ''}
${opp.deadline ? `Дедлайн: ${opp.deadline.toLocaleDateString('ru-RU')}` : ''}
Категории: ${Array.isArray(categories) ? categories.join(', ') : categories}
${opp.link ? `Ссылка: ${opp.link}` : ''}`
    }).join('\n\n')

    // Categorize programs by type
    const learning: typeof allOpportunities = []
    const funding: typeof allOpportunities = []

    allOpportunities.forEach((opp) => {
      const categories = opp.categories ? (typeof opp.categories === 'string' ? JSON.parse(opp.categories) : opp.categories) : []
      const description = (opp.description || '').toLowerCase()
      const title = (opp.title || '').toLowerCase()
      
      // Check if it's a learning/education program
      const isLearning = 
        opp.type === 'accelerator' ||
        opp.type === 'competition' ||
        description.includes('обучение') ||
        description.includes('курс') ||
        description.includes('mentor') ||
        description.includes('mentoring') ||
        description.includes('акселератор') ||
        title.includes('обучение') ||
        title.includes('курс') ||
        title.includes('акселератор')
      
      // Check if it's a funding program
      const isFunding = 
        opp.type === 'grant' ||
        opp.type === 'investment_fund' ||
        opp.amount !== null ||
        description.includes('грант') ||
        description.includes('финансирование') ||
        description.includes('инвестиции') ||
        title.includes('грант') ||
        title.includes('финансирование')
      
      if (isLearning) {
        learning.push(opp)
      }
      if (isFunding) {
        funding.push(opp)
      }
    })

    // Use AI to refine recommendations if there are many programs
    if (allOpportunities.length > 5) {
      try {
        const aiPrompt = `Проанализируй стартап и подбери самые подходящие программы из списка:

СТАРТАП:
Название: ${startupContext.name}
Описание: ${startupContext.description}
Проблема: ${startupContext.problem}
Решение: ${startupContext.idea}
Аудитория: ${startupContext.audience}

ДОСТУПНЫЕ ПРОГРАММЫ (${allOpportunities.length} программ):
${opportunitiesText}

Верни JSON с номерами самых подходящих программ (максимум 5-7 в каждой категории):
{
  "learning": [1, 3, 5],
  "funding": [2, 4, 6]
}

Выбери программы, которые наиболее релевантны для этого стартапа.`

        const aiResponse = await chatWithStartup(startupContext, [
          { role: 'user', content: aiPrompt }
        ])

        // Parse AI response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0])
          
          const aiLearning = (recommendations.learning || [])
            .map((num: number) => allOpportunities[num - 1])
            .filter(Boolean)
          
          const aiFunding = (recommendations.funding || [])
            .map((num: number) => allOpportunities[num - 1])
            .filter(Boolean)

          // Combine AI recommendations with categorized programs, prioritizing AI recommendations
          const finalLearning = [...new Set([...aiLearning, ...learning].map(p => p.id))]
            .map(id => allOpportunities.find(p => p.id === id))
            .filter(Boolean) as typeof allOpportunities
          
          const finalFunding = [...new Set([...aiFunding, ...funding].map(p => p.id))]
            .map(id => allOpportunities.find(p => p.id === id))
            .filter(Boolean) as typeof allOpportunities

          return NextResponse.json({ 
            learning: finalLearning.slice(0, 10), 
            funding: finalFunding.slice(0, 10) 
          })
        }
      } catch (error) {
        console.error('AI recommendation error:', error)
        // Fall through to return categorized programs
      }
    }

    return NextResponse.json({ 
      learning: learning.slice(0, 10), 
      funding: funding.slice(0, 10) 
    })
  } catch (error) {
    console.error('Recommended programs error:', error)
    return NextResponse.json({ 
      error: 'Failed to get recommended programs',
      learning: [],
      funding: []
    }, { status: 500 })
  }
}
