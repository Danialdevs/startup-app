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
import { PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface LPClass {
  id: string
  name: string
  createdAt: string
  _count: { students: number }
}

export default function ClassesPage() {
  const router = useRouter()
  const { setUser } = useStore()
  const [classes, setClasses] = useState<LPClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) { router.push('/'); return }
        const userData = await userRes.json()
        setUser(userData.user)

        const res = await fetch('/api/launchpad/classes')
        if (res.ok) {
          const data = await res.json()
          setClasses(data.classes)
        }
      } catch {
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [router, setUser])

  const createClass = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/launchpad/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setClasses(prev => [{ ...data.class, _count: { students: 0 } }, ...prev])
        setNewName('')
        setIsDialogOpen(false)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const deleteClass = async (id: string) => {
    if (!confirm('Удалить класс? Все ученики и их ответы будут удалены.')) return
    const res = await fetch(`/api/launchpad/classes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClasses(prev => prev.filter(c => c.id !== id))
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
          <h1 className="text-3xl font-bold">Классы</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Новый класс
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать класс</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название класса</label>
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="7А класс"
                    onKeyDown={e => e.key === 'Enter' && createClass()}
                  />
                </div>
                <Button onClick={createClass} disabled={!newName.trim() || isCreating} className="w-full">
                  {isCreating ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserGroupIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет классов</h3>
              <p className="text-muted-foreground mb-4">Создайте класс и добавьте учеников</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Создать класс
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(c => (
              <Card
                key={c.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/launchpad/classes/${c.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <UserGroupIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{c.name}</h3>
                        <p className="text-sm text-muted-foreground">{c._count.students} учеников</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                      onClick={e => { e.stopPropagation(); deleteClass(c.id) }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
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
