'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon,
    PlayCircleIcon,
    CheckCircleIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface Lesson {
    id: string
    title: string
    duration: number | null
    isFree: boolean
    order: number
}

interface Module {
    id: string
    title: string
    description: string
    order: number
    lessons: Lesson[]
}

interface Course {
    id: string
    title: string
    description: string
    image: string | null
    published: boolean
    modules: Module[]
}

export default function CourseDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const { user } = useStore()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)

    // Modals state
    const [isEditCourseOpen, setIsEditCourseOpen] = useState(false)
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false)
    const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)

    // Form data
    const [editCourseData, setEditCourseData] = useState({ title: '', description: '' })
    const [newModuleTitle, setNewModuleTitle] = useState('')
    const [newLessonData, setNewLessonData] = useState({
        title: '',
        videoUrl: '',
        isFree: false,
        moduleId: ''
    })

    useEffect(() => {
        fetchCourse()
    }, [])

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setCourse(data)
            } else {
                router.push('/courses')
            }
        } catch (error) {
            console.error('Failed to fetch courseDetails:', error)
        } finally {
            setLoading(false)
        }
    }

    const openEditCourseModal = () => {
        if (!course) return
        setEditCourseData({ title: course.title, description: course.description })
        setIsEditCourseOpen(true)
    }

    const handleUpdateCourse = async () => {
        if (!course) return
        try {
            const res = await fetch(`/api/courses/${course.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...course,
                    title: editCourseData.title,
                    description: editCourseData.description
                })
            })

            if (res.ok) {
                fetchCourse()
                setIsEditCourseOpen(false)
            }
        } catch (error) {
            console.error('Failed to update course:', error)
        }
    }

    const handleDeleteCourse = async () => {
        if (!confirm('Вы уверены, что хотите удалить этот курс?')) return

        try {
            const res = await fetch(`/api/courses/${params.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                router.push('/courses')
            }
        } catch (error) {
            console.error('Failed to delete course:', error)
        }
    }

    const openCreateModuleModal = () => {
        setNewModuleTitle('')
        setIsCreateModuleOpen(true)
    }

    const handleCreateModule = async () => {
        if (!course || !newModuleTitle) return
        try {
            const res = await fetch('/api/modules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course.id,
                    title: newModuleTitle,
                    description: ''
                })
            })

            if (res.ok) {
                fetchCourse()
                setIsCreateModuleOpen(false)
            }
        } catch (error) {
            console.error('Failed to create module:', error)
        }
    }

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Удалить модуль и все уроки в нем?')) return

        try {
            const res = await fetch(`/api/modules/${moduleId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchCourse()
            }
        } catch (error) {
            console.error('Failed to delete module:', error)
        }
    }

    const openCreateLessonModal = (moduleId: string) => {
        setNewLessonData({ title: '', videoUrl: '', isFree: false, moduleId })
        setIsCreateLessonOpen(true)
    }

    const handleCreateLesson = async () => {
        if (!newLessonData.title || !newLessonData.moduleId) return

        try {
            const res = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleId: newLessonData.moduleId,
                    title: newLessonData.title,
                    videoUrl: newLessonData.videoUrl,
                    content: '',
                    isFree: newLessonData.isFree
                })
            })

            if (res.ok) {
                fetchCourse()
                setIsCreateLessonOpen(false)
            }
        } catch (error) {
            console.error('Failed to create lesson:', error)
        }
    }

    const togglePublish = async () => {
        if (!course) return
        try {
            const res = await fetch(`/api/courses/${course.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...course,
                    published: !course.published
                })
            })
            if (res.ok) fetchCourse()
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    if (loading) return null

    if (!course) return <div>Курс не найден</div>

    return (
        <div className="flex-1 overflow-auto bg-slate-50/50">
            <div className="max-w-5xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => router.push('/courses')}
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Назад к курсам
                    </Button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{course.title}</h1>
                                {!course.published && (
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium border border-yellow-200">
                                        Черновик
                                    </span>
                                )}
                            </div>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                {course.description || 'Описание отсутствует'}
                            </p>
                        </div>
                        {user?.isAdmin && (
                            <div className="flex flex-col gap-2">
                                <Button onClick={togglePublish} variant={course.published ? "secondary" : "default"}>
                                    {course.published ? 'Снять с публикации' : 'Опубликовать'}
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={openEditCourseModal}>
                                        <PencilIcon className="h-4 w-4 mr-2" />
                                        Изменить
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleDeleteCourse}>
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modules */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Программа курса</h2>
                        {user?.isAdmin && (
                            <Button onClick={openCreateModuleModal} size="sm" variant="outline">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Добавить модуль
                            </Button>
                        )}
                    </div>

                    <Accordion type="multiple" className="space-y-4" defaultValue={course.modules.map(m => m.id)}>
                        {course.modules.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-white rounded-xl border border-dashed">
                                В этом курсе пока нет модулей
                            </div>
                        ) : (
                            course.modules.map((module) => (
                                <AccordionItem
                                    key={module.id}
                                    value={module.id}
                                    className="bg-white border rounded-xl px-4"
                                >
                                    <div className="flex items-center justify-between py-2">
                                        <AccordionTrigger className="hover:no-underline py-2">
                                            <div className="text-left">
                                                <h3 className="font-semibold text-lg">{module.title}</h3>
                                                {module.description && (
                                                    <p className="text-sm text-muted-foreground font-normal">{module.description}</p>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                        {user?.isAdmin && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteModule(module.id)
                                                    }}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <AccordionContent className="pb-4">
                                        <div className="space-y-2 mt-2">
                                            {module.lessons.map((lesson) => (
                                                <div
                                                    key={lesson.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
                                                    onClick={() => router.push(`/courses/${course.id}/lessons/${lesson.id}`)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-full flex items-center justify-center",
                                                            lesson.isFree ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"
                                                        )}>
                                                            {lesson.isFree ? <PlayCircleIcon className="h-5 w-5" /> : <LockClosedIcon className="h-4 w-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{lesson.title}</p>
                                                            {lesson.duration && (
                                                                <p className="text-xs text-muted-foreground">{lesson.duration} мин.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {user?.isAdmin ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    router.push(`/courses/${course.id}/lessons/${lesson.id}/edit`)
                                                                }}
                                                            >
                                                                Редактировать
                                                            </Button>
                                                        ) : (
                                                            <ArrowLeftIcon className="h-4 w-4 rotate-180 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {user?.isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start text-muted-foreground hover:text-primary mt-2"
                                                    onClick={() => openCreateLessonModal(module.id)}
                                                >
                                                    <PlusIcon className="h-4 w-4 mr-2" />
                                                    Добавить урок
                                                </Button>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        )}
                    </Accordion>
                </div>
            </div>


            {/* Edit Course Modal */}
            <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактировать курс</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Название</Label>
                            <Input
                                value={editCourseData.title}
                                onChange={(e) => setEditCourseData({ ...editCourseData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Описание</Label>
                            <Textarea
                                value={editCourseData.description}
                                onChange={(e) => setEditCourseData({ ...editCourseData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditCourseOpen(false)}>Отмена</Button>
                        <Button onClick={handleUpdateCourse}>Сохранить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Module Modal */}
            <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый модуль</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Название модуля</Label>
                            <Input
                                value={newModuleTitle}
                                onChange={(e) => setNewModuleTitle(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModuleOpen(false)}>Отмена</Button>
                        <Button onClick={handleCreateModule} disabled={!newModuleTitle}>Создать</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Lesson Modal */}
            <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый урок</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Название урока</Label>
                            <Input
                                value={newLessonData.title}
                                onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ссылка на видео (YouTube)</Label>
                            <Input
                                value={newLessonData.videoUrl}
                                onChange={(e) => setNewLessonData({ ...newLessonData, videoUrl: e.target.value })}
                                placeholder="https://youtube.com/..."
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="newLessonFree"
                                checked={newLessonData.isFree}
                                onCheckedChange={(checked) => setNewLessonData({ ...newLessonData, isFree: checked as boolean })}
                            />
                            <Label htmlFor="newLessonFree">Бесплатный предпросмотр</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateLessonOpen(false)}>Отмена</Button>
                        <Button onClick={handleCreateLesson} disabled={!newLessonData.title}>Создать</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
