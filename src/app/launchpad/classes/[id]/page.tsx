'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LaunchpadSidebar } from '@/components/LaunchpadSidebar'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface Student {
  id: string
  name: string
  email: string
  _count: { responses: number }
}

interface LPClass {
  id: string
  name: string
  students: Student[]
}

interface ReportStudent {
  student: { id: string; name: string }
  totalProjects: number
  completedProjects: number
  completionPercent: number
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [lpClass, setLpClass] = useState<LPClass | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentEmail, setNewStudentEmail] = useState('')
  const [newStudentPassword, setNewStudentPassword] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [activeTab, setActiveTab] = useState<'students' | 'reports'>('students')
  const [report, setReport] = useState<ReportStudent[]>([])
  const [isLoadingReport, setIsLoadingReport] = useState(false)

  useEffect(() => {
    const id = params.id as string | undefined
    if (!id) return

    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          router.push('/')
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        const res = await fetch(`/api/launchpad/classes/${id}`)
        if (res.ok) {
          const data = await res.json()
          setLpClass(data.class)
        } else {
          router.push('/launchpad/classes')
        }
      } catch {
        router.push('/launchpad/classes')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  const addStudent = async () => {
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPassword.trim()) return
    setIsAdding(true)
    setAddError('')
    try {
      const res = await fetch(`/api/launchpad/classes/${params.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudentName.trim(),
          email: newStudentEmail.trim(),
          password: newStudentPassword.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setLpClass(prev => prev ? {
          ...prev,
          students: [...prev.students, { ...data.student, _count: { responses: 0 } }]
        } : prev)
        setNewStudentName('')
        setNewStudentEmail('')
        setNewStudentPassword('')
      } else {
        const data = await res.json()
        setAddError(data.error || 'Ошибка добавления')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const removeStudent = async (studentId: string) => {
    if (!confirm('Удалить ученика?')) return
    const res = await fetch(`/api/launchpad/classes/${params.id}/students?studentId=${studentId}`, { method: 'DELETE' })
    if (res.ok) {
      setLpClass(prev => prev ? {
        ...prev,
        students: prev.students.filter(s => s.id !== studentId)
      } : prev)
    }
  }

  const copyStudentLink = (studentId: string) => {
    const url = `${window.location.origin}/launchpad/s/${studentId}`
    navigator.clipboard.writeText(url)
    alert('Ссылка скопирована!')
  }

  const loadReport = async () => {
    setIsLoadingReport(true)
    try {
      const res = await fetch(`/api/launchpad/classes/${params.id}/reports`)
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
      }
    } finally {
      setIsLoadingReport(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReport()
    }
  }, [activeTab])

  if (isLoading || !lpClass) {
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
          <Button variant="ghost" size="icon" onClick={() => router.push('/launchpad/classes')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lpClass.name}</h1>
            <p className="text-muted-foreground">{lpClass.students.length} учеников</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'students' ? 'default' : 'outline'}
            onClick={() => setActiveTab('students')}
          >
            Ученики
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reports')}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Отчёты
          </Button>
        </div>

        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Add Student */}
            <Card>
              <CardContent className="p-4">
                {addError && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-3">
                    {addError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <Input
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                    placeholder="Имя ученика"
                  />
                  <Input
                    type="email"
                    value={newStudentEmail}
                    onChange={e => setNewStudentEmail(e.target.value)}
                    placeholder="Email"
                  />
                  <Input
                    value={newStudentPassword}
                    onChange={e => setNewStudentPassword(e.target.value)}
                    placeholder="Пароль"
                    onKeyDown={e => e.key === 'Enter' && addStudent()}
                  />
                  <Button
                    onClick={addStudent}
                    disabled={!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPassword.trim() || isAdding}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Добавить
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            {lpClass.students.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Добавьте учеников в класс</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {lpClass.students.map((student, idx) => (
                  <Card key={student.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.email} • {student._count.responses} проектов
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyStudentLink(student.id)}
                            title="Скопировать ссылку ученика"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeStudent(student.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {isLoadingReport ? (
              <div className="flex justify-center py-12">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : report.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Нет данных для отчёта</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Прогресс учеников</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.map(r => (
                        <div key={r.student.id} className="flex items-center gap-4">
                          <span className="text-sm font-medium w-32 truncate">{r.student.name}</span>
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${r.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-24 text-right">
                            {r.completedProjects}/{r.totalProjects} ({r.completionPercent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
