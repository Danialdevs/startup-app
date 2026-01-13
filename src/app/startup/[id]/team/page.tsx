'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface TeamMember {
  id: string
  name: string
  email?: string
  role: string
  skills?: string
}

interface Startup {
  id: string
  name: string
  teamMembers: TeamMember[]
}

export default function TeamPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    skills: ''
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

        const startupRes = await fetch(`/api/startups/${params.id}`)
        if (!startupRes.ok) {
          router.push('/dashboard')
          return
        }
        const startupData = await startupRes.json()
        setStartup(startupData.startup)
      } catch {
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  const openAddModal = () => {
    setEditingMember(null)
    setFormData({ name: '', email: '', role: '', skills: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name || '',
      email: member.email || '',
      role: member.role || '',
      skills: member.skills || ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.role.trim()) return
    setIsAdding(true)
    
    try {
      if (editingMember) {
        // Update existing member
        const res = await fetch(`/api/startups/${params.id}/team`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: editingMember.id, ...formData })
        })
        if (res.ok) {
          const data = await res.json()
          setStartup(prev => prev ? {
            ...prev,
            teamMembers: prev.teamMembers.map(m => m.id === editingMember.id ? data.member : m)
          } : null)
        }
      } else {
        // Add new member
        const res = await fetch(`/api/startups/${params.id}/team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (res.ok) {
          const data = await res.json()
          setStartup(prev => prev ? {
            ...prev,
            teamMembers: [...prev.teamMembers, data.member]
          } : null)
        }
      }
      setFormData({ name: '', email: '', role: '', skills: '' })
      setIsModalOpen(false)
    } catch {}
    finally { setIsAdding(false) }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Удалить участника?')) return
    try {
      const res = await fetch(`/api/startups/${params.id}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId })
      })
      if (res.ok) {
        setStartup(prev => prev ? {
          ...prev,
          teamMembers: prev.teamMembers.filter(m => m.id !== memberId)
        } : null)
      }
    } catch {}
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
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Команда</h1>
            <Button onClick={openAddModal}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Навыки</TableHead>
                  <TableHead className="w-[100px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {startup?.teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Нет участников
                    </TableCell>
                  </TableRow>
                ) : (
                  startup?.teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email || '—'}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell className="text-muted-foreground">{member.skills || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(member)}
                          >
                            <PencilIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Редактировать' : 'Добавить'} участника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Имя *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иван Иванов"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ivan@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Роль *</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Developer, Designer..."
              />
            </div>
            <div className="space-y-2">
              <Label>Навыки</Label>
              <Input
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="React, Python..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={isAdding || !formData.name || !formData.role}>
              {isAdding && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
              {editingMember ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
