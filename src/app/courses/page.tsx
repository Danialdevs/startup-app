'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Course {
    id: string
    title: string
    description: string
    image: string | null
    published: boolean
    _count: {
        modules: number
    }
}

export default function CoursesPage() {
    const router = useRouter()
    const { user } = useStore()
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newCourseTitle, setNewCourseTitle] = useState('')
    const [newCourseDescription, setNewCourseDescription] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses')
            if (res.ok) {
                const data = await res.json()
                setCourses(data)
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCourse = async () => {
        if (!newCourseTitle.trim()) return

        setCreating(true)
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newCourseTitle,
                    description: newCourseDescription,
                    published: false
                })
            })

            if (res.ok) {
                const newCourse = await res.json()
                router.push(`/courses/${newCourse.id}`)
            }
        } catch (error) {
            console.error('Failed to create course:', error)
            alert('Не удалось создать курс')
        } finally {
            setCreating(false)
            setIsCreateModalOpen(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>

                </div>
                {user?.isAdmin && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Создать курс
                    </Button>
                )}
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-dashed">
                    <BookOpenIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Нет доступных курсов</h3>
                    <p className="text-muted-foreground mb-4">
                        В данный момент курсы отсутствуют. Загляните позже!
                    </p>
                    {user?.isAdmin && (
                        <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                            Создать первый курс
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => router.push(`/courses/${course.id}`)}
                        >
                            <div className="aspect-video bg-muted relative">
                                {course.image ? (
                                    <img
                                        src={course.image}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                                        <BookOpenIcon className="h-12 w-12 opacity-50" />
                                    </div>
                                )}
                                {!course.published && (
                                    <div className="absolute top-2 right-2 bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded text-xs font-medium border border-yellow-500/20 backdrop-blur-sm">
                                        Черновик
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">
                                    {course.description || 'Нет описания'}
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <span className="bg-primary/5 text-primary px-2 py-1 rounded font-medium">
                                        {course._count.modules} модулей
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Создать новый курс</DialogTitle>
                        <DialogDescription>
                            Заполните основные данные о курсе. Вы сможете добавить модули и уроки позже.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Название курса</Label>
                            <Input
                                value={newCourseTitle}
                                onChange={(e) => setNewCourseTitle(e.target.value)}
                                placeholder="Например: Основы маркетинга"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Краткое описание</Label>
                            <Textarea
                                value={newCourseDescription}
                                onChange={(e) => setNewCourseDescription(e.target.value)}
                                placeholder="О чем этот курс?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleCreateCourse} disabled={!newCourseTitle || creating}>
                            {creating ? 'Создание...' : 'Создать курс'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
