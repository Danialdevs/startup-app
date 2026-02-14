import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

const PRIORITY_WEIGHTS: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

interface MemberContribution {
  memberId: string
  name: string
  role: string
  tasksDone: number
  tasksInProgress: number
  tasksTodo: number
  tasksTotal: number
  weightedScore: number
  contributionPercent: number
  completionRate: number
  badge: 'leader' | 'active' | 'moderate' | 'inactive'
}

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

    const startup = await prisma.startup.findFirst({
      where: { id, ownerId: session.userId },
      include: {
        teamMembers: true,
        tasks: {
          include: {
            assignees: {
              include: { member: true }
            }
          }
        }
      }
    })

    if (!startup) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { teamMembers, tasks } = startup

    // Build per-member contribution map
    const memberMap = new Map<string, MemberContribution>()

    for (const member of teamMembers) {
      memberMap.set(member.id, {
        memberId: member.id,
        name: member.name || 'Без имени',
        role: member.role,
        tasksDone: 0,
        tasksInProgress: 0,
        tasksTodo: 0,
        tasksTotal: 0,
        weightedScore: 0,
        contributionPercent: 0,
        completionRate: 0,
        badge: 'inactive',
      })
    }

    // Calculate task-based metrics
    for (const task of tasks) {
      const weight = PRIORITY_WEIGHTS[task.priority] ?? 1

      for (const assignee of task.assignees) {
        const entry = memberMap.get(assignee.memberId)
        if (!entry) continue

        entry.tasksTotal++

        if (task.status === 'done') {
          entry.tasksDone++
          entry.weightedScore += weight
        } else if (task.status === 'in_progress') {
          entry.tasksInProgress++
          // Partial credit for in-progress
          entry.weightedScore += weight * 0.3
        } else {
          entry.tasksTodo++
        }
      }
    }

    // Compute totals and percentages
    const contributions = Array.from(memberMap.values())
    const totalWeightedScore = contributions.reduce((sum, c) => sum + c.weightedScore, 0)

    for (const c of contributions) {
      c.contributionPercent = totalWeightedScore > 0
        ? Math.round((c.weightedScore / totalWeightedScore) * 100)
        : 0
      c.completionRate = c.tasksTotal > 0
        ? Math.round((c.tasksDone / c.tasksTotal) * 100)
        : 0
    }

    // Assign badges
    const sorted = [...contributions].sort((a, b) => b.weightedScore - a.weightedScore)
    for (let i = 0; i < sorted.length; i++) {
      const c = sorted[i]
      if (c.tasksTotal === 0) {
        c.badge = 'inactive'
      } else if (i === 0 && c.weightedScore > 0) {
        c.badge = 'leader'
      } else if (c.completionRate >= 60) {
        c.badge = 'active'
      } else if (c.tasksTotal > 0) {
        c.badge = 'moderate'
      } else {
        c.badge = 'inactive'
      }
    }

    // Normalize percentages to sum to 100 (handle rounding)
    const percentSum = contributions.reduce((s, c) => s + c.contributionPercent, 0)
    if (percentSum > 0 && percentSum !== 100 && contributions.length > 0) {
      const maxContrib = contributions.reduce((prev, curr) =>
        curr.contributionPercent > prev.contributionPercent ? curr : prev
      )
      maxContrib.contributionPercent += 100 - percentSum
    }

    // Summary stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return NextResponse.json({
      contributions: sorted,
      summary: {
        totalMembers: teamMembers.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overallCompletionRate,
      },
    })
  } catch (error) {
    console.error('Contributions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
