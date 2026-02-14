'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LaunchpadSidebar } from '@/components/LaunchpadSidebar'
import { useStore } from '@/store/useStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import {
  RocketLaunchIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

interface Stats {
  projects: number
  classes: number
  students: number
}

export default function LaunchpadDashboard() {
  const router = useRouter()
  const { setUser } = useStore()
  const [stats, setStats] = useState<Stats>({ projects: 0, classes: 0, students: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) { router.push('/'); return }
        const userData = await userRes.json()
        setUser(userData.user)

        const [projectsRes, classesRes] = await Promise.all([
          fetch('/api/launchpad/projects'),
          fetch('/api/launchpad/classes'),
        ])

        let projectCount = 0
        let classCount = 0
        let studentCount = 0

        if (projectsRes.ok) {
          const d = await projectsRes.json()
          projectCount = d.projects?.length || 0
        }
        if (classesRes.ok) {
          const d = await classesRes.json()
          classCount = d.classes?.length || 0
          studentCount = d.classes?.reduce((acc: number, c: { _count: { students: number } }) => acc + c._count.students, 0) || 0
        }

        setStats({ projects: projectCount, classes: classCount, students: studentCount })
      } catch {
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [router, setUser])

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
        <h1 className="text-3xl font-bold mb-8">Launchpad Kids</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/launchpad/projects')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <RocketLaunchIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.projects}</p>
                  <p className="text-sm text-muted-foreground">Проектов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/launchpad/classes')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100 text-green-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.classes}</p>
                  <p className="text-sm text-muted-foreground">Классов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <AcademicCapIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.students}</p>
                  <p className="text-sm text-muted-foreground">Учеников</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3">Быстрые действия</h2>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/launchpad/projects')}>
                  <RocketLaunchIcon className="h-4 w-4 mr-2" />
                  Создать проект
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/launchpad/classes')}>
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  Создать класс
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3">О платформе</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Launchpad Kids — платформа для проектной деятельности учеников по методологии STEM.
                Создавайте проекты, добавляйте учеников в классы, генерируйте КСП и отслеживайте прогресс.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
