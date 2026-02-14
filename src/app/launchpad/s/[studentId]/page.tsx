'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface Project {
  id: string
  name: string
  icon: string
  description: string | null
  completed: boolean
}

interface StudentInfo {
  id: string
  name: string
  className: string
}

export default function StudentPortal() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/launchpad/student/${params.studentId}`)
        if (res.ok) {
          const data = await res.json()
          setStudent(data.student)
          setProjects(data.projects)
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.studentId])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <p className="text-6xl mb-4">😔</p>
          <h1 className="text-2xl font-bold mb-2">Ученик не найден</h1>
          <p className="text-muted-foreground">Проверьте ссылку и попробуйте снова</p>
        </div>
      </div>
    )
  }

  const completedCount = projects.filter(p => p.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div>
                <h1 className="text-lg font-bold">{student.name}</h1>
                <p className="text-sm text-muted-foreground">{student.className}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{completedCount}/{projects.length}</p>
              <p className="text-xs text-muted-foreground">выполнено</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Мои проекты</h2>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-4xl mb-4">📋</p>
              <h3 className="text-lg font-semibold mb-2">Пока нет проектов</h3>
              <p className="text-muted-foreground">Учитель скоро добавит проекты</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map(project => (
              <Card
                key={project.id}
                className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
                  project.completed ? 'border-green-200 bg-green-50/50' : 'border-transparent hover:border-blue-200'
                }`}
                onClick={() => router.push(`/launchpad/s/${params.studentId}/project/${project.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{project.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        {project.completed && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      )}
                      <p className={`text-xs mt-2 font-medium ${project.completed ? 'text-green-600' : 'text-blue-600'}`}>
                        {project.completed ? '✅ Выполнено' : '📝 Начать'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
