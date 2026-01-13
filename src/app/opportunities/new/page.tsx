'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface UserWithAdmin {
    id: string
    name: string
    email: string
    isAdmin?: boolean
}

const TYPE_OPTIONS = [
    { value: 'grant', label: 'Грант' },
    { value: 'competition', label: 'Конкурс' },
    { value: 'investment_fund', label: 'Инвестфонд' },
    { value: 'accelerator', label: 'Акселератор' },
]

const CATEGORY_OPTIONS = [
    'IT и технологии',
    'Социальные проекты',
    'Образование',
    'Экология',
    'Медицина',
    'Финтех',
    'Агротех',
    'Креативные индустрии',
]

export default function NewOpportunityPage() {
    const router = useRouter()
    const { user, setUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'grant',
        organization: '',
        amount: '',
        deadline: '',
        link: '',
        eligibility: '',
        categories: [] as string[],
        country: '',
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

                // Check if admin
                if (!(userData.user as UserWithAdmin)?.isAdmin) {
                    router.push('/opportunities')
                    return
                }
            } catch {
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, setUser])

    const toggleCategory = (cat: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }))
    }

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.organization || formData.categories.length === 0) {
            setError('Заполните обязательные поля')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const res = await fetch('/api/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Ошибка')
                return
            }

            router.push('/opportunities')
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
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-2xl">
                    {/* Back */}
                    <Button
                        variant="ghost"
                        className="gap-2 mb-6"
                        onClick={() => router.push('/opportunities')}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Назад
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle>Новая возможность</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Название *</Label>
                                <Input
                                    placeholder="Название гранта/конкурса"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Тип *</Label>
                                <div className="flex flex-wrap gap-2">
                                    {TYPE_OPTIONS.map(({ value, label }) => (
                                        <Button
                                            key={value}
                                            type="button"
                                            variant={formData.type === value ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, type: value })}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Организация *</Label>
                                <Input
                                    placeholder="Название организации"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Описание *</Label>
                                <Textarea
                                    placeholder="Подробное описание..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[120px] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Сумма</Label>
                                    <Input
                                        placeholder="до $10,000"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Дедлайн</Label>
                                    <Input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Категории *</Label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_OPTIONS.map((cat) => (
                                        <Button
                                            key={cat}
                                            type="button"
                                            variant={formData.categories.includes(cat) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => toggleCategory(cat)}
                                        >
                                            {cat}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Ссылка</Label>
                                <Input
                                    placeholder="https://..."
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Страна</Label>
                                <Input
                                    placeholder="Казахстан, Россия, и т.д."
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Требования</Label>
                                <Textarea
                                    placeholder="Кто может участвовать..."
                                    value={formData.eligibility}
                                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                                    className="min-h-[80px] resize-none"
                                />
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                                {isSubmitting && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                                Создать
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
