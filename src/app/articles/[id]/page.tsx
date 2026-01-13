'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    ArrowLeftIcon,
    UserCircleIcon,
    CalendarDaysIcon,
    TrashIcon,
    PencilIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Article {
    id: string
    title: string
    excerpt?: string
    content: string
    image?: string
    published: boolean
    createdAt: string
    author?: {
        id: string
        name: string
        avatar?: string
    }
}

interface UserWithAdmin {
    id: string
    name: string
    email: string
    isAdmin?: boolean
}

export default function ArticleDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { user, setUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [article, setArticle] = useState<Article | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

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
                setIsAdmin((userData.user as UserWithAdmin)?.isAdmin || false)

                const articleRes = await fetch(`/api/articles/${params.id}`)
                if (articleRes.ok) {
                    const data = await articleRes.json()
                    setArticle(data.article)
                } else {
                    router.push('/articles')
                }
            } catch {
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, setUser, params.id])

    const handleDelete = async () => {
        if (!confirm('Удалить эту статью?')) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/articles/${params.id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/articles')
            }
        } catch {
            console.error('Error deleting article')
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!article) {
        return null
    }

    return (
        <div className="flex h-screen bg-muted/30">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-4xl mx-auto">
                    {/* Back Button */}
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={() => router.push('/articles')}
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Назад к статьям
                        </Button>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-1" disabled>
                                    <PencilIcon className="h-4 w-4" />
                                    Редактировать
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-destructive hover:text-destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <TrashIcon className="h-4 w-4" />
                                    )}
                                    Удалить
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Article Card */}
                    <Card>
                        {article.image && (
                            <div className="aspect-video overflow-hidden rounded-t-lg">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <CardContent className="p-8">
                            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
                                {article.author && (
                                    <span className="flex items-center gap-1">
                                        <UserCircleIcon className="h-4 w-4" />
                                        {article.author.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <CalendarDaysIcon className="h-4 w-4" />
                                    {format(new Date(article.createdAt), 'd MMMM yyyy', { locale: ru })}
                                </span>
                            </div>

                            {/* Content */}
                            <div
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
