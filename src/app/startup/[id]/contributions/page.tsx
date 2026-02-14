'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  TrophyIcon,
  FireIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

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

interface Summary {
  totalMembers: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overallCompletionRate: number
}

interface Startup {
  id: string
  name: string
}

const BADGE_CONFIG = {
  leader: {
    label: 'Лидер',
    icon: TrophyIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'ring-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
  },
  active: {
    label: 'Активный',
    icon: FireIcon,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    ring: 'ring-green-500/20',
    gradient: 'from-green-500 to-emerald-500',
  },
  moderate: {
    label: 'Умеренный',
    icon: BoltIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    ring: 'ring-blue-500/20',
    gradient: 'from-blue-500 to-indigo-500',
  },
  inactive: {
    label: 'Неактивен',
    icon: ExclamationTriangleIcon,
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    ring: 'ring-slate-500/20',
    gradient: 'from-slate-400 to-slate-500',
  },
}

const MEMBER_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-amber-500 to-yellow-500',
  'from-cyan-500 to-blue-500',
]

export default function ContributionsPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [contributions, setContributions] = useState<MemberContribution[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          router.push('/')
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        const startupRes = await fetch(`/api/startups/${params.id}`)
        if (!startupRes.ok) {
          router.push('/dashboard')
          return
        }
        const startupData = await startupRes.json()
        setStartup(startupData.startup)

        const contribRes = await fetch(`/api/startups/${params.id}/contributions`)
        if (contribRes.ok) {
          const data = await contribRes.json()
          setContributions(data.contributions || [])
          setSummary(data.summary || null)
        }
      } catch {
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const hasData = contributions.length > 0 && summary && summary.totalTasks > 0

  return (
    <div className="flex h-screen bg-background">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">Вклад команды</h1>
          </div>

          {!hasData ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl">
              <ChartBarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Нет данных для анализа</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Добавьте участников команды и создайте задачи с назначенными исполнителями, чтобы увидеть вклад каждого
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-100">
                        <UserGroupIcon className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Участников</p>
                        <p className="text-xl font-bold">{summary!.totalMembers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Всего задач</p>
                        <p className="text-xl font-bold">{summary!.totalTasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Выполнено</p>
                        <p className="text-xl font-bold">{summary!.completedTasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className={summary!.overallCompletionRate >= 60 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${summary!.overallCompletionRate >= 60 ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <ChartBarIcon className={`h-5 w-5 ${summary!.overallCompletionRate >= 60 ? 'text-green-600' : 'text-orange-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Прогресс</p>
                        <p className="text-xl font-bold">{summary!.overallCompletionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contribution Bar (visual overview) */}
              <div className="mb-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Распределение вклада
                </h2>
                <div className="h-10 rounded-xl overflow-hidden flex shadow-inner border">
                  {contributions.filter(c => c.contributionPercent > 0).map((c, i) => (
                    <div
                      key={c.memberId}
                      className={`bg-gradient-to-b ${MEMBER_COLORS[i % MEMBER_COLORS.length]} flex items-center justify-center relative group transition-all hover:opacity-90`}
                      style={{ width: `${Math.max(c.contributionPercent, 3)}%` }}
                      title={`${c.name}: ${c.contributionPercent}%`}
                    >
                      {c.contributionPercent >= 10 && (
                        <span className="text-white text-xs font-semibold drop-shadow-sm">
                          {c.contributionPercent}%
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                        {c.name} — {c.contributionPercent}%
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                      </div>
                    </div>
                  ))}
                  {contributions.every(c => c.contributionPercent === 0) && (
                    <div className="flex-1 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Нет выполненных задач
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-3">
                  {contributions.filter(c => c.contributionPercent > 0).map((c, i) => (
                    <div key={c.memberId} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${MEMBER_COLORS[i % MEMBER_COLORS.length]}`} />
                      <span className="text-sm text-muted-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Cards */}
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                  Детальный вклад участников
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contributions.map((c, i) => {
                    const badge = BADGE_CONFIG[c.badge]
                    const BadgeIcon = badge.icon

                    return (
                      <Card key={c.memberId} className={`overflow-hidden transition-all hover:shadow-md ${c.badge === 'leader' ? 'ring-2 ' + badge.ring : ''}`}>
                        <CardContent className="p-0">
                          {/* Card Header with gradient */}
                          <div className={`bg-gradient-to-r ${MEMBER_COLORS[i % MEMBER_COLORS.length]} p-4 flex items-center gap-4`}>
                            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold border-2 border-white/30">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">{c.name}</h3>
                              <p className="text-white/80 text-sm">{c.role}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">{c.contributionPercent}%</div>
                              <div className="text-white/70 text-xs">вклад</div>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 space-y-4">
                            {/* Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color} ${badge.border} border`}>
                              <BadgeIcon className="h-3.5 w-3.5" />
                              {badge.label}
                            </div>

                            {/* Task Stats */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-2 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">{c.tasksDone}</div>
                                <div className="text-[11px] text-green-600/70">Готово</div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">{c.tasksInProgress}</div>
                                <div className="text-[11px] text-blue-600/70">В работе</div>
                              </div>
                              <div className="text-center p-2 bg-slate-50 rounded-lg">
                                <div className="text-lg font-bold text-slate-600">{c.tasksTodo}</div>
                                <div className="text-[11px] text-slate-500">Ожидает</div>
                              </div>
                            </div>

                            {/* Completion Rate Bar */}
                            <div>
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground">Выполнение задач</span>
                                <span className="font-medium">{c.completionRate}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    c.completionRate >= 70 ? 'from-green-400 to-emerald-500' :
                                    c.completionRate >= 40 ? 'from-blue-400 to-indigo-500' :
                                    c.completionRate > 0 ? 'from-orange-400 to-red-500' :
                                    'from-slate-300 to-slate-400'
                                  } transition-all duration-500`}
                                  style={{ width: `${c.completionRate}%` }}
                                />
                              </div>
                            </div>

                            {/* Tasks total info */}
                            <div className="text-xs text-muted-foreground pt-1 border-t">
                              Всего назначено: <span className="font-medium text-foreground">{c.tasksTotal}</span> задач
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Leaderboard */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                  Рейтинг участников
                </h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {contributions.map((c, i) => {
                        const badge = BADGE_CONFIG[c.badge]
                        const BadgeIcon = badge.icon

                        return (
                          <div key={c.memberId} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              i === 0 ? 'bg-amber-100 text-amber-700' :
                              i === 1 ? 'bg-slate-100 text-slate-600' :
                              i === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {i + 1}
                            </div>

                            {/* Avatar */}
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${MEMBER_COLORS[i % MEMBER_COLORS.length]} flex items-center justify-center text-white font-semibold text-sm`}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{c.name}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.color}`}>
                                  <BadgeIcon className="h-3 w-3" />
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{c.role}</p>
                            </div>

                            {/* Stats */}
                            <div className="text-right flex items-center gap-6">
                              <div className="hidden sm:block">
                                <div className="text-xs text-muted-foreground">Задач</div>
                                <div className="font-medium text-sm">
                                  <span className="text-green-600">{c.tasksDone}</span>
                                  <span className="text-muted-foreground mx-0.5">/</span>
                                  <span>{c.tasksTotal}</span>
                                </div>
                              </div>

                              {/* Contribution bar */}
                              <div className="w-32 hidden md:block">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${MEMBER_COLORS[i % MEMBER_COLORS.length]} transition-all duration-500`}
                                    style={{ width: `${c.contributionPercent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Percent */}
                              <div className="min-w-[50px] text-right">
                                <span className="text-lg font-bold">{c.contributionPercent}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Methodology note */}
              <div className="mt-8 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm mb-2">Как рассчитывается вклад?</p>
                <p>Система анализирует выполненные задачи с учётом их приоритета (высокий &times;3, средний &times;2, низкий &times;1).</p>
                <p>Задачи в работе получают 30% от веса выполненных. Вклад рассчитывается как доля взвешенного вклада каждого участника от общего.</p>
                <p>Бейджи: <strong>Лидер</strong> — наибольший вклад, <strong>Активный</strong> — выполнение &ge;60%, <strong>Умеренный</strong> — есть задачи, но процент ниже, <strong>Неактивен</strong> — нет задач.</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
