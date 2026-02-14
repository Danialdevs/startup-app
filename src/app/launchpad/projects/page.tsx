'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LaunchpadSidebar } from '@/components/LaunchpadSidebar'
import { useStore } from '@/store/useStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PROJECT_ICONS } from '@/lib/launchpad'

interface Project {
  id: string
  name: string
  icon: string
  description: string | null
  _count: { responses: number; lessonPlans: number }
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user, setUser } = useStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🚀')
  const [newDesc, setNewDesc] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const isAdmin = user?.isAdmin === true

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) { router.push('/'); return }
        const userData = await userRes.json()
        setUser(userData.user)

        const res = await fetch('/api/launchpad/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects)
        }
      } catch {
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [router, setUser])

  const createProject = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/launchpad/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), icon: newIcon, description: newDesc.trim() || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(prev => [{ ...data.project, _count: { responses: 0, lessonPlans: 0 } }, ...prev])
        setNewName('')
        setNewDesc('')
        setNewIcon('🚀')
        setIsDialogOpen(false)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Удалить проект? Все ответы учеников и КСП будут удалены.')) return
    const res = await fetch(`/api/launchpad/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
  }

  if (isLoading) {
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{isAdmin ? 'Проекты' : 'Уроки'}</h1>
            {!isAdmin && <p className="text-muted-foreground mt-1">Ответы ваших учеников по каждому уроку</p>}
          </div>
          {isAdmin && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Новый проект
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать проект</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Иконка</label>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_ICONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewIcon(icon)}
                        className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                          newIcon === icon ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Название проекта</label>
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Мой STEM проект"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Описание (необязательно)</label>
                  <Input
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Краткое описание проекта"
                  />
                </div>
                <Button onClick={createProject} disabled={!newName.trim() || isCreating} className="w-full">
                  {isCreating ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>}
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-4xl mb-4">🚀</p>
              <h3 className="text-lg font-semibold mb-2">Нет проектов</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin ? 'Создайте первый проект для учеников' : 'Администратор пока не добавил проекты'}
              </p>
              {isAdmin && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Создать проект
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Card
                key={project.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/launchpad/projects/${project.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{project.icon}</span>
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                        onClick={e => { e.stopPropagation(); deleteProject(project.id) }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                    <span>{project._count.responses} ответов</span>
                    <span>{project._count.lessonPlans} КСП</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
