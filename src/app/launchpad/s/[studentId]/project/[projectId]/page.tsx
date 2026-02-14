'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'
import { STEM_SECTIONS } from '@/lib/launchpad'

interface Project {
  id: string
  name: string
  icon: string
  description: string | null
}

interface StudentInfo {
  id: string
  name: string
  className: string
}

export default function StudentProjectPage() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/launchpad/student/${params.studentId}/projects/${params.projectId}`)
        if (res.ok) {
          const data = await res.json()
          setStudent(data.student)
          setProject(data.project)
          if (data.answers) {
            setAnswers(data.answers)
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.studentId, params.projectId])

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    setIsSaved(false)
  }

  const saveAnswers = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/launchpad/student/${params.studentId}/projects/${params.projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (res.ok) {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!student || !project) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <p className="text-6xl mb-4">😔</p>
          <h1 className="text-2xl font-bold mb-2">Не найдено</h1>
          <p className="text-muted-foreground">Проверьте ссылку</p>
        </div>
      </div>
    )
  }

  const currentSection = STEM_SECTIONS[activeSection]
  const filledCount = Object.values(answers).filter(v => v.trim()).length
  const totalQuestions = STEM_SECTIONS.reduce((acc, s) => acc + s.questions.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push(`/launchpad/s/${params.studentId}`)}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <span className="text-2xl">{project.icon}</span>
              <div>
                <h1 className="text-sm font-bold">{project.name}</h1>
                <p className="text-xs text-muted-foreground">{student.name} • {student.className}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{filledCount}/{totalQuestions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Section Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STEM_SECTIONS.map((section, idx) => {
            const sectionFilledCount = section.questions.filter(q => answers[q.id]?.trim()).length
            const isComplete = sectionFilledCount === section.questions.length
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  idx === activeSection
                    ? 'bg-primary text-primary-foreground'
                    : isComplete
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-white border hover:bg-muted'
                }`}
              >
                <span>{section.icon}</span>
                <span className="hidden sm:inline">{section.title}</span>
                {isComplete && <CheckIcon className="h-4 w-4" />}
              </button>
            )
          })}
        </div>

        {/* Current Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              {currentSection.icon} {currentSection.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Заполните все поля по вашему проекту
            </p>

            <div className="space-y-5">
              {currentSection.questions.map(question => (
                <div key={question.id}>
                  <label className="text-sm font-medium mb-2 block">{question.label}</label>
                  {question.type === 'text' ? (
                    <Input
                      value={answers[question.id] || ''}
                      onChange={e => updateAnswer(question.id, e.target.value)}
                      placeholder="Введите ответ..."
                    />
                  ) : (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={e => updateAnswer(question.id, e.target.value)}
                      placeholder="Напишите подробный ответ..."
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Navigation & Save */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                disabled={activeSection === 0}
                onClick={() => setActiveSection(prev => prev - 1)}
              >
                ← Назад
              </Button>

              <Button onClick={saveAnswers} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : isSaved ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Сохранено!
                  </>
                ) : (
                  'Сохранить'
                )}
              </Button>

              <Button
                variant="outline"
                disabled={activeSection === STEM_SECTIONS.length - 1}
                onClick={() => setActiveSection(prev => prev + 1)}
              >
                Далее →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
