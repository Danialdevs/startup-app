'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import {
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  LinkIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Question {
  id?: string
  text: string
  type: 'text' | 'single_choice' | 'multiple_choice' | 'rating'
  options?: string[]
  required: boolean
}

interface Answer {
  id: string
  value: string
  question: { id: string; text: string; type: string; options?: string }
}

interface Response {
  id: string
  respondentName?: string
  respondentEmail?: string
  createdAt: string
  answers: Answer[]
}

interface Survey {
  id: string
  title: string
  description?: string
  slug: string
  isPublished: boolean
  aiAnalysis?: string
  questions: Question[]
  responses: Response[]
  _count: { responses: number }
}

interface Analysis {
  summary: string
  problemConfirmed: boolean
  problemConfidence: number
  keyInsights: string[]
  painPoints: string[]
  opportunities: string[]
  risks: string[]
  recommendations: string[]
  audienceSegments: { name: string; percent: number; description: string }[]
  nextSteps: string[]
  overallScore: number
  verdict: string
}

interface Startup { id: string; name: string }

const QUESTION_TYPES = [
  { value: 'text', label: 'Текстовый ответ' },
  { value: 'single_choice', label: 'Один вариант' },
  { value: 'multiple_choice', label: 'Несколько вариантов' },
  { value: 'rating', label: 'Оценка (1-5)' },
]

export default function SurveyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'builder' | 'responses' | 'analytics'>('builder')
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) { router.push('/'); return }
        setUser((await userRes.json()).user)

        const startupRes = await fetch(`/api/startups/${params.id}`)
        if (!startupRes.ok) { router.push('/dashboard'); return }
        setStartup((await startupRes.json()).startup)

        const surveyRes = await fetch(`/api/startups/${params.id}/custdev/${params.surveyId}`)
        if (!surveyRes.ok) { router.push(`/startup/${params.id}/custdev`); return }
        const data = await surveyRes.json()
        setSurvey(data.survey)
        setQuestions(data.survey.questions.map((q: Question & { options?: string }) => ({
          ...q,
          options: q.options ? JSON.parse(q.options as string) : undefined,
        })))
        if (data.survey.aiAnalysis) {
          try { setAnalysis(JSON.parse(data.survey.aiAnalysis)) } catch {}
        }
      } catch { router.push('/dashboard') }
      finally { setIsLoading(false) }
    }
    fetchData()
  }, [params.id, params.surveyId, router, setUser])

  const addQuestion = () => {
    setQuestions(prev => [...prev, { text: '', type: 'text', required: true }])
  }

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q))
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= questions.length) return
    const arr = [...questions]
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    setQuestions(arr)
  }

  const addOption = (qIdx: number) => {
    const q = questions[qIdx]
    updateQuestion(qIdx, { options: [...(q.options || []), ''] })
  }

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const q = questions[qIdx]
    const opts = [...(q.options || [])]
    opts[optIdx] = value
    updateQuestion(qIdx, { options: opts })
  }

  const removeOption = (qIdx: number, optIdx: number) => {
    const q = questions[qIdx]
    updateQuestion(qIdx, { options: (q.options || []).filter((_, i) => i !== optIdx) })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/startups/${params.id}/custdev/${params.surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      })
      if (res.ok) {
        const data = await res.json()
        setSurvey(data.survey)
      }
    } catch (err) { console.error(err) }
    finally { setIsSaving(false) }
  }

  const handlePublish = async (publish: boolean) => {
    try {
      // Save questions first
      await fetch(`/api/startups/${params.id}/custdev/${params.surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, isPublished: publish })
      })
      setSurvey(prev => prev ? { ...prev, isPublished: publish } : null)
    } catch (err) { console.error(err) }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/startups/${params.id}/custdev/${params.surveyId}/generate`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        const generated = (data.questions || []).map((q: Question) => ({
          text: q.text,
          type: q.type || 'text',
          options: q.options,
          required: true,
        }))
        setQuestions(prev => [...prev, ...generated])
      }
    } catch (err) { console.error(err) }
    finally { setIsGenerating(false) }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setActiveTab('analytics')
    try {
      const res = await fetch(`/api/startups/${params.id}/custdev/${params.surveyId}/analyze`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data.analysis)
      }
    } catch (err) { console.error(err) }
    finally { setIsAnalyzing(false) }
  }

  const copyLink = () => {
    if (!survey) return
    navigator.clipboard.writeText(`${window.location.origin}/survey/${survey.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Build stats for responses tab
  const buildQuestionStats = (questionId: string, questionType: string, optionsRaw?: string) => {
    if (!survey) return null
    const answers = survey.responses.flatMap(r => r.answers.filter(a => a.question.id === questionId))
    if (answers.length === 0) return null

    if (questionType === 'rating') {
      const values = answers.map(a => parseInt(a.value)).filter(v => !isNaN(v))
      const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
      const distribution = [1, 2, 3, 4, 5].map(r => ({ rating: r, count: values.filter(v => v === r).length }))
      return { type: 'rating' as const, avg: Math.round(avg * 10) / 10, distribution, total: values.length }
    }

    if (questionType === 'single_choice' || questionType === 'multiple_choice') {
      const options: string[] = optionsRaw ? JSON.parse(optionsRaw) : []
      const counts: Record<string, number> = {}
      options.forEach(o => { counts[o] = 0 })

      answers.forEach(a => {
        if (questionType === 'multiple_choice') {
          try {
            const arr = JSON.parse(a.value)
            if (Array.isArray(arr)) arr.forEach((v: string) => { counts[v] = (counts[v] || 0) + 1 })
          } catch {
            counts[a.value] = (counts[a.value] || 0) + 1
          }
        } else {
          counts[a.value] = (counts[a.value] || 0) + 1
        }
      })

      return { type: 'choice' as const, counts, total: answers.length }
    }

    return { type: 'text' as const, answers: answers.map(a => a.value), total: answers.length }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!survey) return null

  const CHOICE_COLORS = [
    'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-red-500', 'bg-indigo-500',
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.push(`/startup/${params.id}/custdev`)}>
              <ArrowLeftIcon className="h-4 w-4" /> Назад к опросам
            </Button>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{survey.title}</h1>
                {survey.description && <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {survey.isPublished && (
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                    {copied ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                    {copied ? 'Скопировано' : 'Ссылка'}
                  </Button>
                )}
                {survey.isPublished ? (
                  <Button variant="outline" size="sm" onClick={() => handlePublish(false)}>Снять с публикации</Button>
                ) : (
                  <Button size="sm" onClick={() => handlePublish(true)} disabled={questions.length === 0}>
                    Опубликовать
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b mb-6">
            {(['builder', 'responses', 'analytics'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'builder' ? 'Конструктор' : tab === 'responses' ? `Ответы (${survey.responses.length})` : 'Аналитика'}
              </button>
            ))}
          </div>

          {/* Builder Tab */}
          {activeTab === 'builder' && (
            <div className="space-y-4">
              {/* AI Generate */}
              <div className="flex gap-2 mb-6">
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="gap-2 border-purple-200 hover:bg-purple-50 text-purple-600">
                  {isGenerating ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                  {isGenerating ? 'Генерация...' : 'AI сгенерировать вопросы'}
                </Button>
                <Button variant="outline" onClick={addQuestion} className="gap-2">
                  <PlusIcon className="h-4 w-4" /> Добавить вручную
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-2xl">
                  <SparklesIcon className="h-10 w-10 mx-auto text-purple-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Создайте вопросы</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Нажмите &laquo;AI сгенерировать&raquo; или добавьте вопросы вручную
                  </p>
                </div>
              ) : (
                <>
                  {questions.map((q, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="shrink-0 mt-2.5 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div className="flex-1 space-y-3">
                            <Input
                              value={q.text}
                              onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                              placeholder="Текст вопроса..."
                              className="font-medium"
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                              <select
                                value={q.type}
                                onChange={(e) => {
                                  const type = e.target.value as Question['type']
                                  const updates: Partial<Question> = { type }
                                  if ((type === 'single_choice' || type === 'multiple_choice') && !q.options?.length) {
                                    updates.options = ['Вариант 1', 'Вариант 2']
                                  }
                                  if (type === 'text' || type === 'rating') {
                                    updates.options = undefined
                                  }
                                  updateQuestion(idx, updates)
                                }}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                              >
                                {QUESTION_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              <label className="flex items-center gap-1.5 text-sm">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                                  className="rounded"
                                />
                                Обязательный
                              </label>
                            </div>

                            {/* Options for choice questions */}
                            {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                              <div className="space-y-2 pl-2">
                                <Label className="text-xs text-muted-foreground">Варианты ответов:</Label>
                                {(q.options || []).map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 ${q.type === 'single_choice' ? 'rounded-full' : 'rounded'} border-2 border-slate-300 shrink-0`} />
                                    <Input
                                      value={opt}
                                      onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                      placeholder={`Вариант ${optIdx + 1}`}
                                      className="h-8 text-sm"
                                    />
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeOption(idx, optIdx)}>
                                      <TrashIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={() => addOption(idx)} className="text-xs">
                                  <PlusIcon className="h-3 w-3 mr-1" /> Добавить вариант
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0}>
                              <ArrowUpIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveQuestion(idx, 'down')} disabled={idx === questions.length - 1}>
                              <ArrowDownIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeQuestion(idx)}>
                              <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                      Сохранить вопросы
                    </Button>
                    <Button variant="outline" onClick={addQuestion} className="gap-2">
                      <PlusIcon className="h-4 w-4" /> Ещё вопрос
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Responses Tab */}
          {activeTab === 'responses' && (
            <div className="space-y-6">
              {survey.responses.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-2xl">
                  <UserGroupIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Пока нет ответов</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {survey.isPublished ? 'Поделитесь ссылкой на опрос с вашей аудиторией' : 'Опубликуйте опрос, чтобы начать сбор ответов'}
                  </p>
                  {survey.isPublished ? (
                    <Button variant="outline" onClick={copyLink} className="gap-2">
                      <LinkIcon className="h-4 w-4" /> Копировать ссылку
                    </Button>
                  ) : (
                    <Button onClick={() => handlePublish(true)} disabled={questions.length === 0}>Опубликовать</Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Stats per question */}
                  {survey.questions.map(q => {
                    const qParsed = { ...q, options: q.options as string | undefined }
                    const stats = buildQuestionStats(q.id!, q.type, qParsed.options)
                    if (!stats) return null

                    return (
                      <Card key={q.id}>
                        <CardContent className="p-5">
                          <h3 className="font-medium mb-4">{q.text}</h3>

                          {stats.type === 'rating' && (
                            <div>
                              <div className="text-3xl font-bold text-primary mb-3">{stats.avg}<span className="text-lg text-muted-foreground">/5</span></div>
                              <div className="space-y-2">
                                {stats.distribution.map(d => (
                                  <div key={d.rating} className="flex items-center gap-3">
                                    <span className="text-sm w-4 text-right">{d.rating}</span>
                                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-amber-400 rounded-full transition-all"
                                        style={{ width: `${stats.total > 0 ? (d.count / stats.total) * 100 : 0}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-muted-foreground w-8">{d.count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {stats.type === 'choice' && (
                            <div className="space-y-2">
                              {Object.entries(stats.counts).sort((a, b) => b[1] - a[1]).map(([option, count], i) => {
                                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                                return (
                                  <div key={option} className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>{option}</span>
                                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                                      </div>
                                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${CHOICE_COLORS[i % CHOICE_COLORS.length]} transition-all`} style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {stats.type === 'text' && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {stats.answers.map((a, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded-lg text-sm">{a}</div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 text-xs text-muted-foreground">{stats.total} ответов</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {!analysis && !isAnalyzing ? (
                <div className="text-center py-16 border-2 border-dashed rounded-2xl">
                  <ChartBarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI Аналитика</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {survey.responses.length > 0
                      ? 'Запустите AI анализ, чтобы получить инсайты из ответов'
                      : 'Соберите ответы перед запуском анализа'}
                  </p>
                  <Button onClick={handleAnalyze} disabled={survey.responses.length === 0} className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <SparklesIcon className="h-4 w-4" /> Запустить AI анализ
                  </Button>
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-16">
                  <ArrowPathIcon className="h-10 w-10 text-purple-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Анализируем ответы...</h3>
                  <p className="text-sm text-muted-foreground">AI изучает {survey.responses.length} ответов</p>
                </div>
              ) : analysis ? (
                <>
                  {/* Score & Verdict */}
                  <Card className="overflow-hidden">
                    <div className={`p-6 ${analysis.overallScore >= 70 ? 'bg-gradient-to-r from-green-50 to-emerald-50' : analysis.overallScore >= 40 ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : 'bg-gradient-to-r from-red-50 to-orange-50'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`text-5xl font-bold ${analysis.overallScore >= 70 ? 'text-green-600' : analysis.overallScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {analysis.overallScore}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {analysis.problemConfirmed ? 'Проблема подтверждена' : 'Проблема не подтверждена'}
                          </h3>
                          <p className="text-sm text-muted-foreground">{analysis.verdict}</p>
                        </div>
                        <div className="ml-auto">
                          <Button variant="outline" size="sm" onClick={handleAnalyze} className="gap-2">
                            <ArrowPathIcon className="h-3.5 w-3.5" /> Обновить
                          </Button>
                        </div>
                      </div>
                      {/* Confidence bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Уверенность в проблеме</span>
                          <span className="font-medium">{analysis.problemConfidence}%</span>
                        </div>
                        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${analysis.problemConfidence >= 70 ? 'bg-green-500' : analysis.problemConfidence >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${analysis.problemConfidence}%` }} />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Summary */}
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="font-medium mb-2">Общий вывод</h3>
                      <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Insights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Insights */}
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="font-medium flex items-center gap-2 mb-3">
                          <LightBulbIcon className="h-4 w-4 text-amber-500" /> Ключевые инсайты
                        </h3>
                        <div className="space-y-2">
                          {analysis.keyInsights.map((insight, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pain Points */}
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="font-medium flex items-center gap-2 mb-3">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" /> Боли аудитории
                        </h3>
                        <div className="space-y-2">
                          {analysis.painPoints.map((pain, i) => (
                            <div key={i} className="bg-red-50 border border-red-100 p-2.5 rounded-lg text-sm text-red-800">{pain}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Opportunities */}
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="font-medium flex items-center gap-2 mb-3">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" /> Возможности
                        </h3>
                        <div className="space-y-2">
                          {analysis.opportunities.map((opp, i) => (
                            <div key={i} className="bg-green-50 border border-green-100 p-2.5 rounded-lg text-sm text-green-800">{opp}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risks */}
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="font-medium flex items-center gap-2 mb-3">
                          <ShieldCheckIcon className="h-4 w-4 text-orange-500" /> Риски
                        </h3>
                        <div className="space-y-2">
                          {analysis.risks.map((risk, i) => (
                            <div key={i} className="bg-orange-50 border border-orange-100 p-2.5 rounded-lg text-sm text-orange-800">{risk}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Audience Segments */}
                  {analysis.audienceSegments && analysis.audienceSegments.length > 0 && (
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="font-medium mb-4">Сегменты аудитории</h3>
                        <div className="h-6 rounded-full overflow-hidden flex mb-4">
                          {analysis.audienceSegments.map((seg, i) => (
                            <div key={i} className={`${CHOICE_COLORS[i % CHOICE_COLORS.length]} flex items-center justify-center`} style={{ width: `${seg.percent}%` }}>
                              {seg.percent >= 15 && <span className="text-white text-xs font-medium">{seg.percent}%</span>}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysis.audienceSegments.map((seg, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className={`w-3 h-3 rounded-full mt-1 ${CHOICE_COLORS[i % CHOICE_COLORS.length]}`} />
                              <div>
                                <span className="font-medium text-sm">{seg.name}</span>
                                <span className="text-muted-foreground text-sm"> — {seg.percent}%</span>
                                <p className="text-xs text-muted-foreground">{seg.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations & Next Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="font-medium mb-3">Рекомендации</h3>
                        <div className="space-y-2">
                          {analysis.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="font-medium mb-3">Следующие шаги</h3>
                        <div className="space-y-2">
                          {analysis.nextSteps.map((step, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
