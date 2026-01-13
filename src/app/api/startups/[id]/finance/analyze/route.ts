
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { analyzeFinances } from '@/lib/openai'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Get transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                startup: {
                    id: params.id,
                    OR: [
                        { ownerId: session.userId },
                        { teamMembers: { some: { userId: session.userId } } }
                    ]
                }
            },
            orderBy: { date: 'desc' },
            take: 50
        })

        if (transactions.length < 3) {
            return NextResponse.json({ error: 'Добавьте минимум 3 транзакции для анализа' }, { status: 400 })
        }

        const analysis = await analyzeFinances(transactions.map(t => ({
            date: t.date.toISOString().split('T')[0],
            type: t.type,
            amount: t.amount,
            category: t.category,
            description: t.description || ''
        })))

        if (!analysis) {
            console.error('AI Analysis returned null')
            return NextResponse.json({ error: 'Не удалось сгенерировать анализ. Попробуйте позже.' }, { status: 500 })
        }

        return NextResponse.json({ analysis })

    } catch (error) {
        console.error('Finance analysis error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
