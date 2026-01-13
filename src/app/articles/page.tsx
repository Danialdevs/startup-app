'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { RichTextEditor } from '@/components/RichTextEditor'
import {
    PlusIcon,
    DocumentTextIcon,
    UserCircleIcon,
    CalendarDaysIcon
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

export default function ArticlesPage() {
    const router = useRouter()
    const { user, setUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [articles, setArticles] = useState<Article[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        image: '',
        published: true,
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
                setIsAdmin((userData.user as UserWithAdmin)?.isAdmin || false)

                await fetchArticles()
            } catch {
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, setUser])

    const fetchArticles = async () => {
        try {
            const res = await fetch('/api/articles')
            if (res.ok) {
                const data = await res.json()
                setArticles(data.articles)
            }
        } catch {
            console.error('Error fetching articles')
        }
    }

    const handleCreateArticle = async () => {
        if (!formData.title || !formData.content) {
            setError('Заполните обязательные поля')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Ошибка')
                return
            }

            setIsModalOpen(false)
            setFormData({ title: '', excerpt: '', content: '', image: '', published: true })
            await fetchArticles()
        } catch {
            setError('Ошибка')
        } finally {
            setIsSubmitting(false)
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
            <Sidebar />
            <main className="flex-1 overflow-auto lg:ml-0">
                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Статьи</h1>
                        </div>
                        {isAdmin && (
                            <Button size="lg" onClick={() => setIsModalOpen(true)} className="gap-2">
                                <PlusIcon className="h-5 w-5" />
                                Добавить статью
                            </Button>
                        )}
                    </div>

                    {/* Articles Grid */}
                    {articles.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="p-4 rounded-full bg-muted mb-4">
                                    <DocumentTextIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Статей пока нет</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    Скоро здесь появятся полезные материалы о развитии стартапов
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => (
                                <Card
                                    key={article.id}
                                    className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 overflow-hidden"
                                    onClick={() => router.push(`/articles/${article.id}`)}
                                >
                                    {article.image && (
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={article.image}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                            {article.title}
                                        </h3>
                                        {article.excerpt && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {article.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                                            {article.author && (
                                                <span className="flex items-center gap-1">
                                                    <UserCircleIcon className="h-4 w-4" />
                                                    {article.author.name}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <CalendarDaysIcon className="h-4 w-4" />
                                                {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true, locale: ru })}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Article Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Новая статья</DialogTitle>
                        <DialogDescription>
                            Создайте полезный материал для предпринимателей
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Заголовок *</Label>
                            <Input
                                placeholder="Название статьи"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Краткое описание</Label>
                            <Textarea
                                placeholder="Кратко опишите о чём статья..."
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                className="min-h-[80px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>URL изображения</Label>
                            <Input
                                placeholder="https://example.com/image.jpg"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Содержание *</Label>
                            <RichTextEditor
                                content={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="Напишите статью..."
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleCreateArticle} disabled={isSubmitting}>
                            {isSubmitting && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                            Опубликовать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
