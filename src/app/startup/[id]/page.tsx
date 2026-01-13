'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sidebar } from '@/components/Sidebar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useStore } from '@/store/useStore'
import { AnalysisData } from '@/components/StartupAnalysis'
import {
  SparklesIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BriefcaseIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Startup {
  id: string
  name: string
  description?: string
  problem?: string
  idea?: string
  audience?: string
  analysis?: string
  problemAnswers?: { questionId: string; answer: string }[]
  ideaDetails?: { description: string; targetAudience?: string; uniqueValue?: string }
}

type TabType = 'overview' | 'summary' | 'market' | 'roadmap' | 'team' | 'resources'

const TAB_LABELS: Record<TabType, string> = {
  overview: 'Обзор проекта',
  summary: 'Резюме',
  market: 'Анализ рынка',
  roadmap: 'Дорожная карта',
  team: 'Требования к команде',
  resources: 'Ресурсы'
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-yellow-500'
    if (s >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-500`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function StartupOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setStartups } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recommendedPrograms, setRecommendedPrograms] = useState<{
    learning: Array<{ id: string; title: string; organization: string; description: string; link?: string; amount?: string; deadline?: string }>
    funding: Array<{ id: string; title: string; organization: string; description: string; link?: string; amount?: string; deadline?: string }>
  }>({ learning: [], funding: [] })
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [businessPlan, setBusinessPlan] = useState<string | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  
  // Get tab from URL
  const tabFromUrl = searchParams.get('tab') as TabType | null
  const activeTab: TabType = tabFromUrl && ['summary', 'market', 'roadmap', 'team', 'resources'].includes(tabFromUrl) 
    ? tabFromUrl 
    : 'overview'

  const [form, setForm] = useState({
    name: '',
    description: '',
    problem: '',
    idea: '',
    audience: ''
  })

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

        const startupRes = await fetch(`/api/startups/${params.id}`)
        if (!startupRes.ok) {
          router.push('/dashboard')
          return
        }
        const startupData = await startupRes.json()
        setStartup(startupData.startup)

        // Parse analysis if exists
        if (startupData.startup.analysis) {
          try {
            const parsedAnalysis = JSON.parse(startupData.startup.analysis)
            setAnalysis(parsedAnalysis)
          } catch {
            console.error('Failed to parse analysis')
          }
        }

        // Fetch recommended programs
        const programsRes = await fetch(`/api/startups/${params.id}/recommended-programs`)
        if (programsRes.ok) {
          const programsData = await programsRes.json()
          setRecommendedPrograms(programsData)
        }

        const s = startupData.startup
        setForm({
          name: s.name || '',
          description: s.description || '',
          problem: s.problem || '',
          idea: s.idea || '',
          audience: s.audience || ''
        })
      } catch (error) {
        console.error('Page error:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser, setStartups])


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const hasAnalysis = analysis !== null

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{startup?.name}</h1>
            <p className="text-muted-foreground mt-1">
              {TAB_LABELS[activeTab]}
            </p>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Целевая аудитория</Label>
                      <Input
                        value={form.audience}
                        onChange={(e) => setForm({ ...form, audience: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Проблема</Label>
                    <Textarea
                      value={form.problem}
                      onChange={(e) => setForm({ ...form, problem: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Решение</Label>
                    <Textarea
                      value={form.idea}
                      onChange={(e) => setForm({ ...form, idea: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AI Business Plan Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-primary" />
                      Бизнес-план от AI
                    </CardTitle>
                    <Button
                      onClick={async () => {
                        if (!startup) return
                        setIsGeneratingPlan(true)
                        try {
                          const res = await fetch(`/api/startups/${startup.id}/business-plan`, {
                            method: 'POST'
                          })
                          if (res.ok) {
                            const data = await res.json()
                            setBusinessPlan(data.businessPlan)
                          } else {
                            alert('Ошибка при генерации бизнес-плана')
                          }
                        } catch (error) {
                          console.error('Error generating business plan:', error)
                          alert('Ошибка при генерации бизнес-плана')
                        } finally {
                          setIsGeneratingPlan(false)
                        }
                      }}
                      disabled={isGeneratingPlan}
                      variant="outline"
                    >
                      {isGeneratingPlan ? (
                        <>
                          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                          Генерация...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="mr-2 h-4 w-4" />
                          Сгенерировать бизнес-план
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {businessPlan ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>,
                          p: ({ children }) => <p className="mb-3 leading-relaxed text-foreground">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 ml-4">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                        }}
                      >
                        {businessPlan}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <SparklesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Бизнес-план еще не сгенерирован</p>
                      <p className="text-sm">Нажмите кнопку выше, чтобы AI создал подробный бизнес-план для вашего стартапа</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {analysis && (
                <div className="space-y-6">
                  {/* Описание компании и продукта */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <LightBulbIcon className="h-5 w-5 text-primary" />
                        Описание компании и продукта
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold mb-2">Миссия</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.executiveSummary?.keyRecommendations?.[0] || 
                             `Решить проблему ${form.problem || 'нашего целевого рынка'} через ${form.idea || 'инновационное решение'}`}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Видение</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.executiveSummary?.projectedSize ? 
                             `Стать лидером в отрасли с объемом рынка ${analysis.executiveSummary.projectedSize}` :
                             'Стать ведущим решением для целевой аудитории'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Продукт</h4>
                          <p className="text-sm text-muted-foreground">{form.idea || form.description || 'Описание продукта'}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Ценностное предложение</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.executionFactors?.find(f => f.name === 'Ценностное предложение')?.description ||
                             analysis.keyAdvantages?.[0] ||
                             'Уникальное решение проблемы целевой аудитории'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Проблема</h4>
                          <p className="text-sm text-muted-foreground">{form.problem || 'Не указано'}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Решение</h4>
                          <p className="text-sm text-muted-foreground">{form.idea || 'Не указано'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Анализ рынка */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5 text-primary" />
                        Анализ рынка
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold mb-2">Целевая аудитория</h4>
                          <p className="text-sm text-muted-foreground">{form.audience || analysis.executiveSummary?.targetYear || 'Не указано'}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Конкуренты</h4>
                          {analysis.competitors && analysis.competitors.length > 0 ? (
                            <div className="space-y-2">
                              {analysis.competitors.slice(0, 3).map((comp: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <span className="font-medium">{comp.name}</span>
                                  <span className="text-muted-foreground ml-2">({comp.region}, схожесть {comp.similarity}%)</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Анализ конкурентов в процессе</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Преимущества</h4>
                          {analysis.keyAdvantages && analysis.keyAdvantages.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {analysis.keyAdvantages.slice(0, 3).map((adv: string, i: number) => (
                                <li key={i}>{adv}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">Преимущества определяются</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Маркетинг и стратегия продаж */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <RocketLaunchIcon className="h-5 w-5 text-primary" />
                        Маркетинг и стратегия продаж
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold mb-2">Каналы привлечения</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.strategicSuggestions?.[0] || 'Определение каналов привлечения в процессе'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Ценообразование</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.quickWins?.find((qw: any) => qw.title?.toLowerCase().includes('цен'))?.description ||
                             'Модель ценообразования определяется на основе анализа рынка'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Модель внедрения</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.roadmap?.[0]?.items?.[0] || 'Поэтапное внедрение через MVP'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Стратегия масштабирования</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.executiveSummary?.keyRecommendations?.[2] || 
                             analysis.roadmap?.[2]?.phase || 
                             'Масштабирование после валидации MVP'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Операционная деятельность */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BriefcaseIcon className="h-5 w-5 text-primary" />
                        Операционная деятельность
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold mb-2">Этапы разработки</h4>
                          {analysis.roadmap && analysis.roadmap.length > 0 ? (
                            <div className="space-y-2">
                              {analysis.roadmap.map((phase: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <span className="font-medium">{phase.phase}</span>
                                  <span className="text-muted-foreground ml-2">({phase.period})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">План разработки формируется</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Роли в команде</h4>
                          {analysis.teamRequirements?.roles && analysis.teamRequirements.roles.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {analysis.teamRequirements.roles.map((role: any, i: number) => (
                                <li key={i}>
                                  <span className="font-medium">{role.role}</span>: {role.description}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">Требования к команде определяются</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">План-график реализации</h4>
                          {analysis.implementationPlan && analysis.implementationPlan.length > 0 ? (
                            <div className="space-y-2">
                              {analysis.implementationPlan.map((plan: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <span className="font-medium">{plan.title}</span>
                                  <span className="text-muted-foreground ml-2">({plan.period}, {plan.cost})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">График реализации формируется</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Финансовый план */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-primary" />
                        Финансовый план
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold mb-2">Инвестиции</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.implementationPlan?.reduce((sum: number, plan: any) => {
                              const cost = parseFloat(plan.cost?.replace(/[^0-9.]/g, '') || '0')
                              return sum + cost
                            }, 0).toLocaleString('ru-RU', { style: 'currency', currency: 'USD' }) || 
                             analysis.executiveSummary?.recentFunding || 
                             'Определение необходимых инвестиций'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Расходы</h4>
                          {analysis.implementationPlan && analysis.implementationPlan.length > 0 ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {analysis.implementationPlan.map((plan: any, i: number) => (
                                <div key={i}>{plan.title}: {plan.cost}</div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Расходы определяются</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Прогноз доходов</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.executiveSummary?.projectedSize ? 
                             `Потенциальный объем рынка: ${analysis.executiveSummary.projectedSize}` :
                             'Прогноз доходов формируется на основе анализа рынка'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Стратегия привлечения инвестиций</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.resources?.find((r: any) => r.category === 'Финансирование')?.items?.[0]?.name ||
                             analysis.executiveSummary?.recentFunding ||
                             'Определение стратегии привлечения инвестиций'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

              {activeTab === 'summary' && analysis?.executiveSummary && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={async (e) => {
                    if (!analysis || !startup) return
                    
                    const button = e.currentTarget as HTMLButtonElement
                    button.disabled = true
                    
                    try {
                      // Get the report content element (exclude buttons)
                      const reportElement = document.getElementById('summary-report-content')
                      if (!reportElement) {
                        console.error('Element not found: summary-report-content')
                        alert('Ошибка: элемент отчета не найден')
                        return
                      }
                      
                      // Wait a bit for DOM to be ready
                      await new Promise(resolve => setTimeout(resolve, 300))
                      
                      // Create canvas from HTML with fix for oklab color function
                      const canvas = await html2canvas(reportElement, {
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                      })
                      
                      if (!canvas) {
                        throw new Error('Canvas creation failed')
                      }
                      
                      const imgData = canvas.toDataURL('image/png', 1.0)
                      if (!imgData || imgData === 'data:,') {
                        throw new Error('Image data conversion failed')
                      }
                      
                      const pdf = new jsPDF('p', 'mm', 'a4')
                      const pdfWidth = pdf.internal.pageSize.getWidth()
                      const pdfHeight = pdf.internal.pageSize.getHeight()
                      
                      // Calculate image dimensions
                      const imgWidth = canvas.width
                      const imgHeight = canvas.height
                      
                      // Convert pixels to mm (assuming 96 DPI)
                      const pxToMm = 0.264583
                      const imgWidthMm = imgWidth * pxToMm
                      const imgHeightMm = imgHeight * pxToMm
                      
                      // Scale to fit PDF width
                      const ratio = pdfWidth / imgWidthMm
                      const scaledHeight = imgHeightMm * ratio
                      const scaledWidth = pdfWidth
                      
                      // Add image to PDF (split across pages if needed)
                      let heightLeft = scaledHeight
                      let position = 0
                      
                      pdf.addImage(imgData, 'PNG', 0, position, scaledWidth, scaledHeight)
                      heightLeft -= pdfHeight
                      
                      // Add remaining pages if needed
                      while (heightLeft > 0) {
                        position = heightLeft - scaledHeight
                        pdf.addPage()
                        pdf.addImage(imgData, 'PNG', 0, position, scaledWidth, scaledHeight)
                        heightLeft -= pdfHeight
                      }
                      
                      // Save PDF
                      pdf.save(`${startup.name}_отчет_${new Date().toISOString().split('T')[0]}.pdf`)
                    } catch (error) {
                      console.error('PDF generation error:', error)
                      console.error('Error details:', {
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                      })
                      alert(`Ошибка при создании PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Попробуйте еще раз.`)
                    } finally {
                      button.disabled = false
                    }
                  }}
                  variant="outline"
                >
                  <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                  Скачать отчет
                </Button>
                <Button 
                  onClick={async () => {
                    setIsReanalyzing(true)
                    try {
                      const res = await fetch(`/api/startups/${params.id}/reanalyze`, {
                        method: 'POST'
                      })
                      if (res.ok) {
                        const data = await res.json()
                        setAnalysis(data.analysis)
                        // Refresh page data
                        window.location.reload()
                      }
                    } catch (error) {
                      console.error('Reanalyze error:', error)
                    } finally {
                      setIsReanalyzing(false)
                    }
                  }}
                  disabled={isReanalyzing}
                  variant="outline"
                >
                  {isReanalyzing ? (
                    <>
                      <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                      Анализ...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="mr-2 h-4 w-4" />
                      Повторный анализ
                    </>
                  )}
                </Button>
              </div>

              {/* Report Content (for PDF) */}
              <div id="summary-report-content" className="space-y-6">
              {/* Verdict */}
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-xl ${
                      analysis.executiveSummary.verdict === 'excellent' ? 'bg-green-500/10' :
                      analysis.executiveSummary.verdict === 'good' ? 'bg-blue-500/10' :
                      'bg-yellow-500/10'
                    }`}>
                      <span className="text-4xl">
                        {analysis.executiveSummary.verdict === 'excellent' ? '🚀' :
                         analysis.executiveSummary.verdict === 'good' ? '✨' : '💡'}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${
                        analysis.executiveSummary.verdict === 'excellent' ? 'text-green-500' :
                        analysis.executiveSummary.verdict === 'good' ? 'text-blue-500' :
                        'text-yellow-500'
                      }`}>
                        {analysis.executiveSummary.verdict === 'excellent' ? 'Отличный потенциал!' :
                         analysis.executiveSummary.verdict === 'good' ? 'Хороший потенциал' :
                         'Умеренный потенциал'}
                      </h3>
                      <p className="text-muted-foreground">Общая оценка: {analysis.executiveSummary.overallScore}/100</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-card border p-4 mb-6">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-primary">Перспективный рынок:</span> объем рынка — {analysis.executiveSummary.marketSize}, 
                      среднегодовой темп роста — {analysis.executiveSummary.growthRate}, прогноз — {analysis.executiveSummary.projectedSize}.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Основные рекомендации
                    </h4>
                    {analysis.executiveSummary.keyRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg bg-card border p-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {i + 1}
                        </span>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Confidence Scores */}
              {analysis.confidenceScores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Система оценки достоверности</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="rounded-xl border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Проверка проблемы</span>
                          <span className="text-lg font-bold text-primary">{analysis.confidenceScores.problemValidation.score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{analysis.confidenceScores.problemValidation.description}</p>
                      </div>
                      <div className="rounded-xl border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Проверка решения</span>
                          <span className="text-lg font-bold text-primary">{analysis.confidenceScores.solutionValidation.score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{analysis.confidenceScores.solutionValidation.description}</p>
                      </div>
                      <div className="rounded-xl border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Проверка рынка</span>
                          <span className="text-lg font-bold text-primary">{analysis.confidenceScores.marketValidation.score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{analysis.confidenceScores.marketValidation.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Advantages & Problems */}
              <div className="grid md:grid-cols-2 gap-6">
                {analysis.keyAdvantages && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        Ключевые преимущества
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.keyAdvantages.map((adv, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <p>{adv}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.problemAreas && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                        Проблемные области
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.problemAreas.map((prob, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-500 mt-0.5">!</span>
                          <p>{prob}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Competitors */}
              {analysis.competitors && analysis.competitors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RocketLaunchIcon className="h-5 w-5 text-primary" />
                      Похожие стартапы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.competitors.map((competitor: any, i: number) => (
                        <div key={i} className="rounded-xl border p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-base">{competitor.name}</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  {competitor.region}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  competitor.similarity >= 80 ? 'bg-green-500/10 text-green-600' :
                                  competitor.similarity >= 60 ? 'bg-yellow-500/10 text-yellow-600' :
                                  'bg-orange-500/10 text-orange-600'
                                }`}>
                                  {competitor.similarity}% схожести
                                </span>
                              </div>
                              {competitor.funding && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  Финансирование: <span className="font-medium">{competitor.funding}</span>
                                </p>
                              )}
                              {competitor.stage && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  Стадия: <span className="font-medium">{competitor.stage}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          {competitor.advantages && competitor.advantages.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-green-600 mb-1">Их преимущества:</p>
                              <ul className="space-y-1">
                                {competitor.advantages.map((adv: string, j: number) => (
                                  <li key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                                    <span className="text-green-500 mt-0.5">+</span>
                                    <span>{adv}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {competitor.disadvantages && competitor.disadvantages.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-orange-600 mb-1">Их недостатки:</p>
                              <ul className="space-y-1">
                                {competitor.disadvantages.map((dis: string, j: number) => (
                                  <li key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                                    <span className="text-orange-500 mt-0.5">−</span>
                                    <span>{dis}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          )}

          {activeTab === 'market' && analysis && (
            <div className="space-y-6">
              {/* Green/Red Flags */}
              {analysis.marketAnalysis && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        Зелёный свет
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.marketAnalysis.greenFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                          <CheckIcon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        Красные флаги
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.marketAnalysis.redFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Market Factors */}
              {analysis.marketFactors && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Рыночные факторы</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.marketFactors.map((factor, i) => (
                      <div key={i} className="space-y-2">
                        <ScoreBar score={factor.score} label={factor.name} />
                        <p className="text-xs text-muted-foreground pl-1">{factor.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Execution Factors */}
              {analysis.executionFactors && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Факторы исполнения</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.executionFactors.map((factor, i) => (
                      <div key={i} className="space-y-2">
                        <ScoreBar score={factor.score} label={factor.name} />
                        <p className="text-xs text-muted-foreground pl-1">{factor.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Strategic Suggestions */}
              {analysis.strategicSuggestions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LightBulbIcon className="h-5 w-5 text-primary" />
                      Стратегические предложения
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.strategicSuggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm leading-relaxed">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'roadmap' && analysis && (
            <div className="space-y-6">
              {/* Roadmap */}
              {analysis.roadmap && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-primary" />
                      Дорожная карта
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-yellow-500 to-blue-500 hidden md:block" />
                      
                      {/* Roadmap phases */}
                      <div className="space-y-8">
                        {analysis.roadmap.map((phase, i) => (
                          <div key={i} className="relative">
                            {/* Phase marker */}
                            <div className="flex items-start gap-4 md:gap-6">
                              <div className="relative z-10 flex-shrink-0">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                  i === 0 ? 'bg-green-500' : 
                                  i === 1 ? 'bg-yellow-500' : 
                                  'bg-blue-500'
                                }`}>
                                  {i + 1}
                                </div>
                              </div>
                              
                              {/* Phase content */}
                              <div className="flex-1 pt-1">
                                <div className="mb-4">
                                  <h4 className="font-bold text-lg mb-1">{phase.phase}</h4>
                                  <p className="text-sm text-muted-foreground">{phase.period}</p>
                                </div>
                                
                                {/* Phase items */}
                                <div className="space-y-3 bg-card border rounded-lg p-4">
                                  {phase.items.map((item, j) => (
                                    <div key={j} className="flex items-start gap-3 group">
                                      <div className="mt-0.5 flex-shrink-0">
                                        <Checkbox 
                                          id={`roadmap-${i}-${j}`}
                                          className="border-2"
                                        />
                                      </div>
                                      <label 
                                        htmlFor={`roadmap-${i}-${j}`}
                                        className="flex-1 text-sm leading-relaxed cursor-pointer group-hover:text-primary transition-colors"
                                      >
                                        <span className="font-medium text-muted-foreground mr-2">{j + 1}.</span>
                                        {item}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Questions */}
              {analysis.keyQuestions && analysis.keyQuestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LightBulbIcon className="h-5 w-5 text-primary" />
                      Ключевые вопросы для ответа
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.keyQuestions.map((question, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <LightBulbIcon className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                          <p className="text-sm">{question}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'team' && analysis?.teamRequirements && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-primary" />
                    Требования к команде
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-3xl font-bold text-primary">{analysis.teamRequirements.initialSize}</p>
                      <p className="text-sm text-muted-foreground">Человек в команде</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-3xl font-bold text-primary">{analysis.teamRequirements.mvpTimeline}</p>
                      <p className="text-sm text-muted-foreground">До MVP</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-sm font-medium mb-2">Ключевые роли:</p>
                      {analysis.teamRequirements.roles.map((role, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm mb-1">
                          <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{role.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-primary" />
                    Подборка ресурсов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Learning Programs */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Обучение
                      </h4>
                      <div className="space-y-2">
                        {recommendedPrograms.learning.length > 0 ? (
                          recommendedPrograms.learning.map((program: any) => (
                            <div key={program.id} className="rounded-lg border p-3 hover:border-primary/50 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <span className="font-medium text-sm block">{program.title}</span>
                                  <p className="text-xs text-muted-foreground mt-1">{program.organization}</p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
                                </div>
                              </div>
                              {program.link && (
                                <a 
                                  href={program.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-2 inline-block"
                                >
                                  Подробнее →
                                </a>
                              )}
                            </div>
                          ))
                        ) : analysis?.resources?.find((r: any) => r.category === 'Обучение') ? (
                          analysis.resources.find((r: any) => r.category === 'Обучение')!.items.map((item: any, j: number) => (
                            <div key={j} className="rounded-lg border p-3">
                              <span className="font-medium text-sm">{item.name}</span>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Нет доступных программ обучения</p>
                        )}
                      </div>
                    </div>

                    {/* Funding Programs */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Финансирование
                      </h4>
                      <div className="space-y-2">
                        {recommendedPrograms.funding.length > 0 ? (
                          recommendedPrograms.funding.map((program: any) => (
                            <div key={program.id} className="rounded-lg border p-3 hover:border-primary/50 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <span className="font-medium text-sm block">{program.title}</span>
                                  <p className="text-xs text-muted-foreground mt-1">{program.organization}</p>
                                  {program.amount && (
                                    <p className="text-xs font-semibold text-primary mt-1">{program.amount}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
                                  {program.deadline && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Дедлайн: {new Date(program.deadline).toLocaleDateString('ru-RU')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {program.link && (
                                <a 
                                  href={program.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-2 inline-block"
                                >
                                  Подробнее →
                                </a>
                              )}
                            </div>
                          ))
                        ) : analysis?.resources?.find((r: any) => r.category === 'Финансирование') ? (
                          analysis.resources.find((r: any) => r.category === 'Финансирование')!.items.map((item: any, j: number) => (
                            <div key={j} className="rounded-lg border p-3">
                              <span className="font-medium text-sm">{item.name}</span>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Нет доступных программ финансирования</p>
                        )}
                      </div>
                    </div>

                    {/* Other Resources from AI Analysis */}
                    {analysis?.resources && analysis.resources.filter((r: any) => r.category !== 'Обучение' && r.category !== 'Финансирование').map((category: any, i: number) => (
                      <div key={i} className="space-y-3 md:col-span-2">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          {category.category}
                        </h4>
                        <div className="space-y-2">
                          {category.items.map((item: any, j: number) => (
                            <div key={j} className="rounded-lg border p-3">
                              <span className="font-medium text-sm">{item.name}</span>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sources */}
              {analysis?.sources && analysis.sources.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Источники исследований ({analysis.sources.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.sources.map((source, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted">
                          {source}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* No analysis fallback */}
          {!hasAnalysis && activeTab !== 'overview' && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SparklesIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Анализ недоступен</h3>
                <p className="text-muted-foreground text-center">
                  Создайте новый стартап с AI-анализом, чтобы увидеть подробную информацию
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
