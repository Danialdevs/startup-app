'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AIThinkingAnimation, ANALYSIS_STEPS } from '@/components/AIThinkingAnimation'
import {
  PlusIcon,
  TrashIcon,
  RocketLaunchIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Startup {
  id: string
  name: string
  description?: string
  createdAt: string
  _count?: { teamMembers: number; tasks: number }
}

const STEPS = [
  { id: 'idea', title: 'Идея', description: 'Опишите вашу идею' },
  { id: 'audience', title: 'Аудитория', description: 'Кто ваши клиенты?' },
  { id: 'problem', title: 'Проблема', description: 'Какую проблему решаете?' },
  { id: 'questions', title: 'Вопросы', description: 'Уточняющие вопросы' },
  { id: 'analyzing', title: 'Анализ', description: 'AI анализирует данные' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, setUser, setStartups, startups } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')

  const [currentStep, setCurrentStep] = useState(0)
  const [isLoadingAI, setIsLoadingAI] = useState(false)

  // Analysis loading state
  const [analysisStep, setAnalysisStep] = useState(0)
  const [showAnalyzing, setShowAnalyzing] = useState(false)
  const [currentAnalysisAction, setCurrentAnalysisAction] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    idea: '',
    audience: '',
    problem: '',
  })

  // AI data
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({})

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

        const startupsRes = await fetch('/api/startups')
        if (startupsRes.ok) {
          const startupsData = await startupsRes.json()
          setStartups(startupsData.startups)
        }
      } catch {
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, setUser, setStartups])

  const openModal = () => {
    setIsModalOpen(true)
    setCurrentStep(0)
    setError('')
    setFormData({ name: '', idea: '', audience: '', problem: '' })
    setAiQuestions([])
    setAiAnswers({})
    setShowAnalyzing(false)
    setAnalysisStep(0)
    setCurrentAnalysisAction('')
  }

  const runAnalysisAnimation = async () => {
    setIsModalOpen(false)
    setShowAnalyzing(true)
    
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i)
      setCurrentAnalysisAction(ANALYSIS_STEPS[i].text)
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600))
    }
  }

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 0 && (!formData.name.trim() || !formData.idea.trim())) {
      setError('Заполните все поля')
      return
    }
    if (currentStep === 1 && !formData.audience.trim()) {
      setError('Укажите целевую аудиторию')
      return
    }
    if (currentStep === 2 && !formData.problem.trim()) {
      setError('Опишите проблему')
      return
    }

    setError('')

    // Step 2 -> 3: Get AI questions
    if (currentStep === 2) {
      setIsLoadingAI(true)
      try {
        const res = await fetch('/api/ai/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.idea,
            audience: formData.audience,
            problem: formData.problem
          })
        })
        if (res.ok) {
          const data = await res.json()
          setAiQuestions(data.questions || [])
        }
      } catch {
        setError('Ошибка AI')
      } finally {
        setIsLoadingAI(false)
      }
    }

    // Step 3 -> 4: Get comprehensive AI analysis and create startup
    if (currentStep === 3) {
      const allAnswered = aiQuestions.every(q => aiAnswers[q]?.trim())
      if (!allAnswered) {
        setError('Ответьте на все вопросы')
        return
      }

      // Start analysis animation
      runAnalysisAnimation()

      try {
        // Get comprehensive analysis
        const analysisRes = await fetch('/api/ai/comprehensive-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.idea,
            audience: formData.audience,
            problem: formData.problem,
            idea: formData.idea,
            answers: aiAnswers
          })
        })
        
        let analysis = null
        if (analysisRes.ok) {
          const data = await analysisRes.json()
          analysis = data.analysis
        }

        // Create startup with analysis
        const startupRes = await fetch('/api/startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.idea,
            problem: formData.problem,
            idea: formData.idea,
            audience: formData.audience,
            analysis: analysis
          })
        })

        if (startupRes.ok) {
          const startupData = await startupRes.json()
          setStartups([...startups, startupData.startup])
          // Redirect to startup page with analysis
          router.push(`/startup/${startupData.startup.id}`)
        } else {
          throw new Error('Failed to create startup')
        }
      } catch (err) {
        setError('Ошибка создания стартапа')
        setShowAnalyzing(false)
        setIsModalOpen(true)
        setCurrentStep(3)
      }
      return
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setError('')
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleDeleteStartup = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Удалить стартап?')) return
    try {
      const res = await fetch(`/api/startups/${id}`, { method: 'DELETE' })
      if (res.ok) setStartups(startups.filter(s => s.id !== id))
    } catch { }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Full page AI analyzing animation
  if (showAnalyzing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          <AIThinkingAnimation 
            currentStep={analysisStep}
            totalSteps={ANALYSIS_STEPS.length}
            currentAction={currentAnalysisAction}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Мои стартапы</h1>
            </div>
            <Button size="lg" onClick={openModal} className="gap-2">
              <PlusIcon className="h-5 w-5" />
              Новый стартап
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <RocketLaunchIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{startups.length}</p>
                    <p className="text-sm text-muted-foreground">Стартапов</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {(startups as Startup[]).reduce((acc, s) => acc + (s._count?.teamMembers || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Участников</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {(startups as Startup[]).reduce((acc, s) => acc + (s._count?.tasks || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Задач</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Startups Grid */}
          {startups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <RocketLaunchIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Нет стартапов</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Создайте свой первый стартап и получите AI-анализ рынка
                </p>
                <Button size="lg" onClick={openModal}>
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Создать первый стартап
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(startups as Startup[]).map((startup) => (
                <Card
                  key={startup.id}
                  className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                  onClick={() => router.push(`/startup/${startup.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                        <RocketLaunchIcon className="h-6 w-6" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteStartup(e, startup.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {startup.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {startup.description || 'Без описания'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserGroupIcon className="h-4 w-4" />
                          {startup._count?.teamMembers || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                          {startup._count?.tasks || 0}
                        </span>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                      {formatDistanceToNow(new Date(startup.createdAt), { addSuffix: true, locale: ru })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Startup Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">{STEPS[Math.min(currentStep, 3)].title}</DialogTitle>
            <DialogDescription>{STEPS[Math.min(currentStep, 3)].description}</DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <div className="flex gap-1 mb-4">
            {STEPS.slice(0, 4).map((step, i) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
              />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Step 0: Idea */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Название проекта *</Label>
                  <Input
                    placeholder="Например: EduTech Platform"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Опишите вашу идею *</Label>
                  <Textarea
                    placeholder="Что вы хотите создать? Какой продукт или сервис?"
                    value={formData.idea}
                    onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Audience */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Целевая аудитория *</Label>
                  <Textarea
                    placeholder="Кто ваши клиенты? Опишите их возраст, профессию, интересы, потребности..."
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="min-h-[150px] resize-none"
                  />
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    💡 Чем точнее вы опишете аудиторию, тем лучше AI проведёт анализ рынка
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Problem */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Какую проблему вы решаете? *</Label>
                  <Textarea
                    placeholder="Опишите боль вашей целевой аудитории. Что их не устраивает сейчас?"
                    value={formData.problem}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    className="min-h-[150px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: AI Questions */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {aiQuestions.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <ArrowPathIcon className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  aiQuestions.map((q, i) => (
                    <div key={i} className="space-y-2">
                      <Label className="text-sm">{q}</Label>
                      <Textarea
                        value={aiAnswers[q] || ''}
                        onChange={(e) => setAiAnswers({ ...aiAnswers, [q]: e.target.value })}
                        className="min-h-[80px] resize-none"
                        placeholder="Ваш ответ..."
                      />
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}

          {currentStep < 4 && (
            <DialogFooter className="gap-2 sm:gap-2 mt-4">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} disabled={isLoadingAI}>
                  <ChevronLeftIcon className="mr-1 h-4 w-4" />
                  Назад
                </Button>
              )}
              <Button onClick={handleNext} disabled={isLoadingAI}>
                {isLoadingAI && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep === 3 ? (
                  <>
                    <SparklesIcon className="mr-2 h-4 w-4" />
                    Анализировать
                  </>
                ) : (
                  <>
                    Далее
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
