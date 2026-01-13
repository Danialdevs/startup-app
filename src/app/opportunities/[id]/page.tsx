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
    CalendarDaysIcon,
    BanknotesIcon,
    GlobeAltIcon,
    ArrowTopRightOnSquareIcon,
    TrophyIcon,
    BuildingOfficeIcon,
    RocketLaunchIcon,
    CheckBadgeIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Opportunity {
    id: string
    title: string
    description: string
    type: string
    organization: string
    amount?: string
    deadline?: string
    link?: string
    eligibility?: string
    categories: string
    country?: string
    active: boolean
}

const TYPE_MAP: Record<string, { label: string; icon: typeof BanknotesIcon }> = {
    grant: { label: 'Грант', icon: BanknotesIcon },
    competition: { label: 'Конкурс', icon: TrophyIcon },
    investment_fund: { label: 'Инвестиционный фонд', icon: BuildingOfficeIcon },
    accelerator: { label: 'Акселератор', icon: RocketLaunchIcon },
}

interface UserWithAdmin {
    id: string
    name: string
    email: string
    isAdmin?: boolean
}

export default function OpportunityDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { user, setUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

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

                const oppRes = await fetch(`/api/opportunities/${params.id}`)
                if (oppRes.ok) {
                    const data = await oppRes.json()
                    setOpportunity(data.opportunity)
                } else {
                    router.push('/opportunities')
                }
            } catch {
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, setUser, params.id])

    const parseCategories = (categoriesStr: string): string[] => {
        try {
            return JSON.parse(categoriesStr)
        } catch {
            return []
        }
    }

    const getTypeInfo = (type: string) => {
        return TYPE_MAP[type] || { label: type, icon: BanknotesIcon }
    }

    const isDeadlinePassed = (deadline?: string) => {
        if (!deadline) return false
        return new Date(deadline) < new Date()
    }

    const handleDelete = async () => {
        if (!confirm('Удалить эту возможность?')) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/opportunities/${params.id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (res.ok) {
                router.push('/opportunities')
            }
        } catch {
            console.error('Error deleting')
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

    if (!opportunity) {
        return null
    }

    const typeInfo = getTypeInfo(opportunity.type)
    const TypeIcon = typeInfo.icon

    return (
        <div className="flex h-screen bg-muted/30">
            <Sidebar />
            <main className="flex-1 overflow-auto lg:ml-0">
                <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        className="mb-6 gap-2"
                        onClick={() => router.push('/opportunities')}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Назад к списку
                    </Button>

                    {/* Main Card */}
                    <Card className="mb-6">
                        <CardContent className="p-8">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-primary/10 text-primary">
                                            <TypeIcon className="h-4 w-4" />
                                            {typeInfo.label}
                                        </span>
                                        {isDeadlinePassed(opportunity.deadline) && (
                                            <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700">
                                                Приём заявок завершён
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2">{opportunity.title}</h1>
                                    <p className="text-lg text-muted-foreground">{opportunity.organization}</p>
                                </div>

                                {opportunity.link && (
                                    <Button asChild className="gap-2 shrink-0">
                                        <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                                            Перейти на сайт
                                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                        </a>
                                    </Button>
                                )}
                                {isAdmin && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="shrink-0"
                                    >
                                        {isDeleting ? (
                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <TrashIcon className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Key Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-muted/50">
                                {opportunity.amount && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Финансирование</p>
                                        <p className="font-semibold flex items-center gap-1">
                                            <BanknotesIcon className="h-4 w-4 text-green-600" />
                                            {opportunity.amount}
                                        </p>
                                    </div>
                                )}
                                {opportunity.deadline && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Дедлайн</p>
                                        <p className="font-semibold flex items-center gap-1">
                                            <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                                            {format(new Date(opportunity.deadline), 'd MMMM yyyy', { locale: ru })}
                                        </p>
                                    </div>
                                )}
                                {opportunity.country && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Страна</p>
                                        <p className="font-semibold flex items-center gap-1">
                                            <GlobeAltIcon className="h-4 w-4 text-purple-600" />
                                            {opportunity.country}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold mb-3">Описание</h2>
                                <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
                            </div>

                            {/* Eligibility */}
                            {opportunity.eligibility && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <CheckBadgeIcon className="h-5 w-5 text-primary" />
                                        Требования для участия
                                    </h2>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.eligibility}</p>
                                </div>
                            )}

                            {/* Categories */}
                            <div>
                                <h2 className="text-lg font-semibold mb-3">Категории</h2>
                                <div className="flex flex-wrap gap-2">
                                    {parseCategories(opportunity.categories).map((cat, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CTA */}
                    {opportunity.link && !isDeadlinePassed(opportunity.deadline) && (
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold mb-1">Готовы подать заявку?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Перейдите на официальный сайт для подачи заявки
                                    </p>
                                </div>
                                <Button asChild size="lg" className="gap-2">
                                    <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                                        Подать заявку
                                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    )
}
