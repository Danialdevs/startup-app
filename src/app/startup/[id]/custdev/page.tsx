'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import {
  PlusIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  EyeIcon,
  LinkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Survey {
  id: string
  title: string
  description?: string
  slug: string
  isPublished: boolean
  createdAt: string
  _count: { questions: number; responses: number }
}

interface Startup {
  id: string
  name: string
}

function FormattedDate({ date }: { date: string }) {
  const [formatted, setFormatted] = useState('')
  useEffect(() => {
    setFormatted(new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }))
  }, [date])
  return <>{formatted}</>
}

export default function CustDevPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [formData, setFormData] = useState({ title: '', description: '' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) { router.push('/'); return }
        const userData = await userRes.json()
        setUser(userData.user)

        const startupRes = await fetch(`/api/startups/${params.id}`)
        if (!startupRes.ok) { router.push('/dashboard'); return }
        const startupData = await startupRes.json()
        setStartup(startupData.startup)

        const surveysRes = await fetch(`/api/startups/${params.id}/custdev`)
        if (surveysRes.ok) {
          const data = await surveysRes.json()
          setSurveys(data.surveys || [])
        }
      } catch { router.push('/dashboard') }
      finally { setIsLoading(false) }
    }
    fetchData()
  }, [params.id, router, setUser])

  const handleCreate = async () => {
    if (!formData.title.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/startups/${params.id}/custdev`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/startup/${params.id}/custdev/${data.survey.id}`)
      }
    } catch (err) { console.error(err) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (surveyId: string) => {
    if (!confirm('Удалить опрос и все ответы?')) return
    try {
      const res = await fetch(`/api/startups/${params.id}/custdev`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId })
      })
      if (res.ok) {
        setSurveys(prev => prev.filter(s => s.id !== surveyId))
      }
    } catch {}
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/survey/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">CustDev Опросы</h1>
            </div>
            <Button onClick={() => { setFormData({ title: '', description: '' }); setIsModalOpen(true) }} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Новый опрос
            </Button>
          </div>

          {surveys.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Нет опросов</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Создайте CustDev опрос, чтобы проверить ваши гипотезы. AI поможет сгенерировать вопросы или вы можете создать их вручную.
              </p>
              <Button onClick={() => { setFormData({ title: '', description: '' }); setIsModalOpen(true) }}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Создать первый опрос
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map(survey => (
                <Card
                  key={survey.id}
                  className="group hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/startup/${params.id}/custdev/${survey.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{survey.title}</h3>
                          {survey.isPublished ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
                              <CheckCircleIcon className="h-3 w-3" />
                              Активен
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                              Черновик
                            </span>
                          )}
                        </div>
                        {survey.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{survey.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                        <span>{survey._count.questions} вопр.</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>{survey._count.responses} ответов</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        <FormattedDate date={survey.createdAt} />
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {survey.isPublished && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); copyLink(survey.slug) }}
                          >
                            {copied === survey.slug ? (
                              <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <LinkIcon className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); router.push(`/startup/${params.id}/custdev/${survey.id}`) }}
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(survey.id) }}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый CustDev опрос</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название опроса *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Например: Исследование проблемы доставки"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание цели опроса..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={isSaving || !formData.title.trim()}>
              {isSaving && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
