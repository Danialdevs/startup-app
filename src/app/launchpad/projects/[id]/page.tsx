'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LaunchpadSidebar } from '@/components/LaunchpadSidebar'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { ArrowLeftIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { STEM_SECTIONS } from '@/lib/launchpad'

const TABLE_HEADER_MARKERS = ['Ход урока', 'Сабақтың барысы', 'Lesson Flow']

/** Парсит таблицу "Ход урока": объединяет многострочные ячейки в одну строку с <br> */
function parseLessonFlowTable(content: string): string {
  const lines = content.split(/\r?\n/)
  let tableStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (TABLE_HEADER_MARKERS.some(m => line.includes(m)) && (line.includes('##') || lines[i + 1]?.trim().startsWith('|'))) {
      tableStartIndex = line.includes('##') ? i : i + 1
      break
    }
  }
  if (tableStartIndex < 0) return content

  let headerRowIndex = tableStartIndex
  while (headerRowIndex < lines.length) {
    const t = lines[headerRowIndex].trim()
    if (t.startsWith('|') || (t.includes('Этап') && t.includes('Действия'))) break
    headerRowIndex++
  }
  if (headerRowIndex >= lines.length) return content
  let headerLine = lines[headerRowIndex].trim()
  if (!headerLine.startsWith('|') && headerLine.includes('\t')) {
    headerLine = '| ' + headerLine.replace(/\t/g, ' | ') + ' |'
  }
  const numCols = Math.max(2, (headerLine.match(/\|/g) || []).length - 1)

  const normalizeRow = (line: string): string => {
    const t = line.trim()
    if (t.startsWith('|')) return t
    if (t.includes('\t')) return '| ' + t.replace(/\t/g, ' | ') + ' |'
    return t
  }
  const parseRow = (line: string): string[] => {
    const normalized = normalizeRow(line)
    const parts = normalized.split('|').map(s => s.trim())
    const cells = parts.slice(1, parts.length - 1)
    return cells.slice(0, numCols)
  }

  const rows: string[][] = []
  let currentRow: string[] = []
  let separatorLine = ''
  let tableEndIndex = headerRowIndex + 1

  for (let j = headerRowIndex; j < lines.length; j++) {
    tableEndIndex = j + 1
    const line = lines[j]
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentRow.length) {
        rows.push(currentRow)
        currentRow = []
      }
      continue
    }
    if (trimmed.startsWith('##')) {
      tableEndIndex = j
      break
    }
    if (trimmed.startsWith('|') || (trimmed.includes('\t') && headerRowIndex < j)) {
      if (currentRow.length) {
        rows.push(currentRow)
        currentRow = []
      }
      const rowLine = normalizeRow(line)
      if (/^\|[\s\-:]+\|/.test(rowLine)) {
        separatorLine = rowLine
        continue
      }
      const cells = parseRow(rowLine)
      if (cells.length >= numCols) currentRow = cells
      continue
    }
    if (currentRow.length) {
      const pipeSplit = trimmed.split(/\s+\|\s+/)
      if (pipeSplit.length >= 2) {
        currentRow[currentRow.length - 1] = (currentRow[currentRow.length - 1] + '<br>' + pipeSplit[0]).trim()
        for (let k = 1; k < pipeSplit.length; k++) {
          currentRow.push(pipeSplit[k])
          if (currentRow.length >= numCols) {
            rows.push(currentRow.slice(0, numCols))
            currentRow = currentRow.slice(numCols)
          }
        }
      } else {
        currentRow[currentRow.length - 1] = (currentRow[currentRow.length - 1] + '<br>' + trimmed).trim()
      }
    }
  }
  if (currentRow.length) rows.push(currentRow)

  const headerCells = parseRow(headerLine)
  if (headerCells.length < numCols) return content

  const sep = '|' + Array(numCols).fill('---').join('|') + '|'
  const tableLines: string[] = [
    '| ' + headerCells.slice(0, numCols).join(' | ') + ' |',
    separatorLine || sep,
    ...rows.map(cells => '| ' + cells.slice(0, numCols).map(c => c.replace(/\n/g, '<br>')).join(' | ') + ' |')
  ]
  const before = lines.slice(0, headerRowIndex).join('\n')
  const after = lines.slice(tableEndIndex).join('\n')
  return before + '\n\n' + tableLines.join('\n') + '\n\n' + after
}

/** Подготовка контента КСП: парсинг таблицы "Ход урока", склеенные строки таблиц. <br> не трогаем — рендерятся через rehype-raw */
function prepareKspContent(raw: string): string {
  if (!raw?.trim()) return raw
  let text = raw
  text = parseLessonFlowTable(text)
  text = text.replace(/\|\|/g, '|\n|')
  return text
}

interface LessonPlan {
  id: string
  language: string
  subject: string | null
  grade: string | null
  topic: string | null
  duration: number
  content: string
  createdAt: string
}

interface StudentResponse {
  id: string
  answers: string
  createdAt: string
  updatedAt: string
  student: { id: string; name: string; class: { name: string } }
}

interface Project {
  id: string
  name: string
  icon: string
  description: string | null
  lessonPlans: LessonPlan[]
  responses: StudentResponse[]
  _count: { responses: number }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, setUser } = useStore()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ksp' | 'responses'>('ksp')
  const isAdmin = user?.isAdmin === true

  // KSP form
  const [kspLanguage, setKspLanguage] = useState<'ru' | 'kz'>('ru')
  const [kspTopic, setKspTopic] = useState('')
  const [kspSubject, setKspSubject] = useState('')
  const [kspGrade, setKspGrade] = useState('')
  const [kspDuration, setKspDuration] = useState('45')
  const [kspTeacher, setKspTeacher] = useState('')
  const [kspGoals, setKspGoals] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Expanded KSP
  const [expandedKsp, setExpandedKsp] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) { router.push('/'); return }
        const userData = await userRes.json()
        setUser(userData.user)

        const res = await fetch(`/api/launchpad/projects/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setProject(data.project)
        } else {
          router.push('/launchpad/projects')
        }
      } catch {
        router.push('/launchpad/projects')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  const generateKsp = async () => {
    if (!isAdmin) return
    if (!kspTopic.trim() || !kspSubject.trim() || !kspGrade.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/launchpad/projects/${params.id}/ksp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: kspLanguage,
          topic: kspTopic,
          subject: kspSubject,
          grade: kspGrade,
          duration: parseInt(kspDuration) || 45,
          teacherName: kspTeacher || 'Учитель',
          learningGoals: kspGoals || kspTopic,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setProject(prev => prev ? {
          ...prev,
          lessonPlans: [data.lessonPlan, ...prev.lessonPlans]
        } : prev)
        setExpandedKsp(data.lessonPlan.id)
        setKspTopic('')
        setKspGoals('')
      } else if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Только суперадмин может генерировать КСП')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <LaunchpadSidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/launchpad/projects')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <span className="text-4xl">{project.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && <p className="text-muted-foreground">{project.description}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'ksp' ? 'default' : 'outline'}
            onClick={() => setActiveTab('ksp')}
          >
            КСП ({project.lessonPlans.length})
          </Button>
          <Button
            variant={activeTab === 'responses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('responses')}
          >
            Ответы учеников ({project.responses.length})
          </Button>
        </div>

        {activeTab === 'ksp' && (
          <div className="space-y-6">
            {/* Generate KSP Form — only for admin */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5" />
                    Генерация КСП
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Язык</label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={kspLanguage === 'ru' ? 'default' : 'outline'}
                          onClick={() => setKspLanguage('ru')}
                        >
                          Русский
                        </Button>
                        <Button
                          size="sm"
                          variant={kspLanguage === 'kz' ? 'default' : 'outline'}
                          onClick={() => setKspLanguage('kz')}
                        >
                          Қазақша
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Тема урока *</label>
                      <Input value={kspTopic} onChange={e => setKspTopic(e.target.value)} placeholder="Тема урока" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Предмет *</label>
                      <Input value={kspSubject} onChange={e => setKspSubject(e.target.value)} placeholder="Математика, Информатика..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Класс *</label>
                      <Input value={kspGrade} onChange={e => setKspGrade(e.target.value)} placeholder="7 класс" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Длительность (мин)</label>
                      <Input value={kspDuration} onChange={e => setKspDuration(e.target.value)} type="number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">ФИО учителя</label>
                      <Input value={kspTeacher} onChange={e => setKspTeacher(e.target.value)} placeholder="Иванов И.И." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Цели обучения</label>
                      <Input value={kspGoals} onChange={e => setKspGoals(e.target.value)} placeholder="Учебные цели урока" />
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    onClick={generateKsp}
                    disabled={!kspTopic.trim() || !kspSubject.trim() || !kspGrade.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Генерация...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Сгенерировать КСП
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* KSP List — учитель видит те же КСП, что создал админ */}
            {project.lessonPlans.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">{isAdmin ? 'Сгенерированные КСП' : 'Готовые КСП'}</h2>
                  {!isAdmin && (
                    <p className="text-sm text-muted-foreground mt-0.5">КСП созданы администратором — вы видите готовые планы уроков</p>
                  )}
                </div>
                {project.lessonPlans.map(plan => (
                  <Card key={plan.id}>
                    <CardContent className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedKsp(expandedKsp === plan.id ? null : plan.id)}
                      >
                        <div>
                          <h3 className="font-medium">{plan.topic || 'КСП'}</h3>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span>{plan.language === 'kz' ? '🇰🇿 Қазақша' : '🇷🇺 Русский'}</span>
                            {plan.subject && <span>{plan.subject}</span>}
                            {plan.grade && <span>{plan.grade}</span>}
                            <span>{new Date(plan.createdAt).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                        <span className="text-muted-foreground">{expandedKsp === plan.id ? '▲' : '▼'}</span>
                      </div>
                      {expandedKsp === plan.id && (
                        <div className="mt-4 pt-4 border-t prose prose-sm max-w-none dark:prose-invert ksp-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-4 rounded-lg border border-border">
                                  <table className="w-full text-sm border-collapse">{children}</table>
                                </div>
                              ),
                              thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                              tbody: ({ children }) => <tbody>{children}</tbody>,
                              tr: ({ children }) => <tr className="border-b border-border hover:bg-muted/20">{children}</tr>,
                              th: ({ children }) => (
                                <th className="border border-border px-3 py-2 text-left font-semibold align-top first:min-w-[11rem] first:whitespace-nowrap">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-border px-3 py-2 text-left align-top first:min-w-[11rem] first:whitespace-nowrap">
                                  {children}
                                </td>
                              ),
                              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            }}
                          >
                            {prepareKspContent(plan.content)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {isAdmin ? 'Сгенерируйте первый КСП выше' : 'Администратор пока не добавил КСП по этому проекту'}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-4">
            {!isAdmin && <p className="text-sm text-muted-foreground">Ответы ваших учеников по этому уроку</p>}
            {project.responses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {isAdmin ? 'Пока нет ответов от учеников' : 'Пока нет ответов от ваших учеников'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              project.responses.map(response => {
                let answers: Record<string, string> = {}
                try { answers = JSON.parse(response.answers) } catch { /* empty */ }

                return (
                  <Card key={response.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{response.student.name}</h3>
                          <p className="text-sm text-muted-foreground">{response.student.class.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(response.updatedAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {STEM_SECTIONS.map(section => {
                          const sectionAnswers = section.questions.filter(q => answers[q.id]?.trim())
                          if (sectionAnswers.length === 0) return null
                          return (
                            <div key={section.id}>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                {section.icon} {section.title}
                              </h4>
                              <div className="space-y-2 pl-4">
                                {sectionAnswers.map(q => (
                                  <div key={q.id}>
                                    <p className="text-xs text-muted-foreground">{q.label}</p>
                                    <p className="text-sm">{answers[q.id]}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
