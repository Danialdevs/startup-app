'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

interface Question {
  id: string
  text: string
  type: 'text' | 'single_choice' | 'multiple_choice' | 'rating'
  options?: string[]
  required: boolean
}

interface Survey {
  id: string
  title: string
  description?: string
  startupName: string
  questions: Question[]
}

export default function PublicSurveyPage() {
  const params = useParams()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [respondentName, setRespondentName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await fetch(`/api/survey/${params.slug}`)
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        setSurvey(data.survey)
      } catch { setNotFound(true) }
      finally { setIsLoading(false) }
    }
    fetchSurvey()
  }, [params.slug])

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const toggleMultiChoice = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || []
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option]
    setAnswer(questionId, updated)
  }

  const handleSubmit = async () => {
    if (!survey) return

    // Validate required
    for (const q of survey.questions) {
      if (q.required) {
        const a = answers[q.id]
        if (!a || (Array.isArray(a) && a.length === 0) || (typeof a === 'string' && !a.trim())) {
          alert(`Пожалуйста, ответьте на вопрос: "${q.text}"`)
          return
        }
      }
    }

    setIsSubmitting(true)
    try {
      // Serialize answers for API
      const serialized: Record<string, string> = {}
      for (const [qId, val] of Object.entries(answers)) {
        serialized[qId] = Array.isArray(val) ? JSON.stringify(val) : val
      }

      const res = await fetch(`/api/survey/${params.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentName: respondentName || null, answers: serialized })
      })
      if (res.ok) {
        setIsSubmitted(true)
      }
    } catch (err) { console.error(err) }
    finally { setIsSubmitting(false) }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Опрос не найден</h1>
          <p className="text-muted-foreground">Возможно ссылка устарела или опрос был закрыт</p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Спасибо за ответы!</h1>
          <p className="text-muted-foreground">Ваши ответы были записаны. Они помогут нам сделать продукт лучше.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Опрос от {survey.startupName}</p>
          <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
          {survey.description && <p className="text-muted-foreground">{survey.description}</p>}
        </div>

        {/* Respondent Name */}
        <Card className="mb-4">
          <CardContent className="p-5">
            <label className="block text-sm font-medium mb-2">Ваше имя <span className="text-muted-foreground">(необязательно)</span></label>
            <Input
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Как вас зовут?"
            />
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {survey.questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex gap-2 mb-4">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{q.text}</h3>
                    {q.required && <span className="text-xs text-red-500">* Обязательный</span>}
                  </div>
                </div>

                {/* Text input */}
                {q.type === 'text' && (
                  <Textarea
                    value={(answers[q.id] as string) || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Ваш ответ..."
                    className="min-h-[80px] resize-none"
                  />
                )}

                {/* Single choice */}
                {q.type === 'single_choice' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt}
                        onClick={() => setAnswer(q.id, opt)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          answers[q.id] === opt ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          answers[q.id] === opt ? 'border-primary' : 'border-slate-300'
                        }`}>
                          {answers[q.id] === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Multiple choice */}
                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const selected = ((answers[q.id] as string[]) || []).includes(opt)
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                          onClick={() => toggleMultiChoice(q.id, opt)}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            selected ? 'border-primary bg-primary' : 'border-slate-300'
                          }`}>
                            {selected && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </div>
                          <span className="text-sm">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Rating */}
                {q.type === 'rating' && (
                  <div className="flex gap-2 justify-center py-2">
                    {[1, 2, 3, 4, 5].map(r => {
                      const selected = parseInt(answers[q.id] as string) >= r
                      return (
                        <button
                          key={r}
                          onClick={() => setAnswer(q.id, String(r))}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          {selected ? (
                            <StarSolidIcon className="h-10 w-10 text-amber-400" />
                          ) : (
                            <StarIcon className="h-10 w-10 text-slate-300" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="px-8">
            {isSubmitting && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
            Отправить ответы
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by Launch Pad
        </p>
      </div>
    </div>
  )
}
