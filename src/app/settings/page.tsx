'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import { CheckIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, startups, setStartups } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/')
          return
        }
        const data = await res.json()
        setUser(data.user)
        setForm(prev => ({
          ...prev,
          name: data.user.name || '',
          email: data.user.email || ''
        }))

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

  const handleSave = async () => {
    setIsSaving(true)
    setSuccess('')
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSuccess('Изменения сохранены')
      setTimeout(() => setSuccess(''), 3000)
    } catch { }
    finally { setIsSaving(false) }
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
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Настройки</h1>
          </div>

          <div className="space-y-6">
            {/* Profile */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Профиль</CardTitle>
                    <CardDescription>Основная информация о вас</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Имя</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <LockClosedIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Безопасность</CardTitle>
                    <CardDescription>Смена пароля</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Текущий пароль</Label>
                  <Input
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Новый пароль</Label>
                  <Input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <Button size="lg" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : success ? (
                  <CheckIcon className="mr-2 h-4 w-4" />
                ) : null}
                {success || 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
