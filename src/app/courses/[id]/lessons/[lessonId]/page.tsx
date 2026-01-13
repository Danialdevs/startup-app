'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon } from '@heroicons/react/24/outline'

interface Lesson {
    id: string
    title: string
    description: string | null
    content: string | null
    videoUrl: string | null
    isFree: boolean
    module: {
        id: string
        title: string
        course: {
            id: string
            title: string
        }
    }
}

export default function LessonPage() {
    // ... existing hook calls ...
    const router = useRouter()
    const params = useParams()
    const { user } = useStore()
    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [loading, setLoading] = useState(true)

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

    // ... existing helper functions ...
    const getYoutubeEmbedUrl = (url: string) => {
        try {
            if (!url) return null
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
            const match = url.match(regExp)
            return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null
        } catch (e) {
            return null
        }
    }

    if (loading) return null

    if (!lesson) return <div>Урок не найден</div>

    const embedUrl = lesson.videoUrl ? getYoutubeEmbedUrl(lesson.videoUrl) : null

    return (
        <div className="flex-1 overflow-auto bg-white">
            <div className="max-w-4xl mx-auto">
                {/* Header Navigation */}
                <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/courses/${lesson.module.course.id}`)}
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        К курсу
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
                            {lesson.module.course.title} / {lesson.module.title}
                        </span>
                        {user?.isAdmin && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/courses/${lesson.module.course.id}/lessons/${lesson.id}/edit`)}
                            >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Редактировать
                            </Button>
                        )}
                    </div>
                </div>

                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>

                    {/* Video Player */}
                    {embedUrl && (
                        <div className="aspect-video bg-black rounded-xl overflow-hidden mb-8 shadow-lg">
                            <iframe
                                src={embedUrl}
                                title={lesson.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
                    />

                    {/* Navigation Footer */}
                    <div className="mt-12 pt-8 border-t flex items-center justify-between">
                        <Button variant="outline" disabled>
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Предыдущий урок
                        </Button>
                        <Button>
                            Следующий урок
                            <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
