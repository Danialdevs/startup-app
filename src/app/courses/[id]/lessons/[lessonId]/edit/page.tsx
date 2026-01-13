'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeftIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { RichTextEditor } from '@/components/RichTextEditor'

interface Lesson {
    id: string
    title: string
    description: string | null
    content: string | null
    videoUrl: string | null
    isFree: boolean
    duration: number | null
    order: number
    moduleId: string
}

export default function EditLessonPage() {
    const router = useRouter()
    const params = useParams()
    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchLesson()
    }, [])

    const fetchLesson = async () => {
        try {
            const res = await fetch(`/api/lessons/${params.lessonId}`)
            if (res.ok) {
                const data = await res.json()
                setLesson(data)
            } else {
                router.push(`/courses/${params.id}`)
            }
        } catch (error) {
            console.error('Failed to fetch lesson:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!lesson) return
        setSaving(true)

        try {
            const res = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lesson)
            })

            if (res.ok) {
                router.push(`/courses/${params.id}/lessons/${lesson.id}`)
            } else {
                alert('Ошибка при сохранении')
            }
        } catch (error) {
            console.error('Failed to save lesson:', error)
            alert('Ошибка при сохранении')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return null
    if (!lesson) return <div>Урок не найден</div>

    return (
        <div className="flex h-full bg-slate-50">
            {/* Sidebar / Settings */}
            <div className="w-[400px] border-r bg-white flex flex-col h-full overflow-y-auto">
                <div className="p-4 border-b flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Button>
                    <h2 className="font-semibold">Настройки урока</h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label>Название урока</Label>
                        <Input
                            value={lesson.title}
                            onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                        />
                    </div>


                    <div className="space-y-2">
                        <Label>Ссылка на видео (YouTube)</Label>
                        <Input
                            value={lesson.videoUrl || ''}
                            onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value })}
                            placeholder="https://youtube.com/..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Длительность (минут)</Label>
                        <Input
                            type="number"
                            value={lesson.duration || 0}
                            onChange={(e) => setLesson({ ...lesson, duration: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Порядок сортировки</Label>
                        <Input
                            type="number"
                            value={lesson.order}
                            onChange={(e) => setLesson({ ...lesson, order: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="isFree"
                            checked={lesson.isFree}
                            onCheckedChange={(checked) => setLesson({ ...lesson, isFree: checked as boolean })}
                        />
                        <Label htmlFor="isFree">Бесплатный предпросмотр</Label>
                    </div>

                    <div className="pt-8">
                        <Button className="w-full" onClick={handleSave} disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить изменения'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content / Editor */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Редактор контента</span>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <Button variant="ghost" size="sm" className="h-7 px-2 bg-white shadow-sm">
                                <ComputerDesktopIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                                <DevicePhoneMobileIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto bg-white min-h-[500px] shadow-sm rounded-xl border">
                        <RichTextEditor
                            content={lesson.content || ''}
                            onChange={(html) => setLesson({ ...lesson, content: html })}
                            placeholder="Введите содержание урока..."
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
