'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    BanknotesIcon,
    GlobeAltIcon,
    ArrowTopRightOnSquareIcon,
    TrophyIcon,
    BuildingOfficeIcon,
    RocketLaunchIcon,
    AcademicCapIcon,
    PlusIcon
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

const TYPE_OPTIONS = [
    { value: 'grant', label: 'Программы', icon: BanknotesIcon },
    { value: 'competition', label: 'Конкурсы', icon: TrophyIcon },
    { value: 'investment_fund', label: 'Инвестфонды', icon: BuildingOfficeIcon },
    { value: 'accelerator', label: 'Акселераторы', icon: RocketLaunchIcon },
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

interface UserWithAdmin {
    id: string
    name: string
    email: string
    isAdmin?: boolean
}

export default function OpportunitiesPage() {
    const router = useRouter()
    const { user, setUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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

                await fetchOpportunities()
            } catch {
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, setUser])

    const fetchOpportunities = async (type?: string, category?: string, search?: string) => {
        try {
            const params = new URLSearchParams()
            if (type) params.set('type', type)
            if (category) params.set('category', category)
            if (search) params.set('search', search)

            const res = await fetch(`/api/opportunities?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setOpportunities(data.opportunities)
            }
        } catch {
            console.error('Error fetching opportunities')
        }
    }

    const handleSearch = () => {
        fetchOpportunities(selectedType || undefined, selectedCategory || undefined, searchQuery || undefined)
    }

    const handleTypeFilter = (type: string) => {
        const newType = selectedType === type ? null : type
        setSelectedType(newType)
        fetchOpportunities(newType || undefined, selectedCategory || undefined, searchQuery || undefined)
    }

    const handleCategoryFilter = (category: string) => {
        const newCategory = selectedCategory === category ? null : category
        setSelectedCategory(newCategory)
        fetchOpportunities(selectedType || undefined, newCategory || undefined, searchQuery || undefined)
    }

    const parseCategories = (categoriesStr: string): string[] => {
        try {
            return JSON.parse(categoriesStr)
        } catch {
            return []
        }
    }

    const getTypeInfo = (type: string) => {
        return TYPE_OPTIONS.find(t => t.value === type) || { label: type, icon: BanknotesIcon }
    }

    const isDeadlineSoon = (deadline?: string) => {
        if (!deadline) return false
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return days <= 14 && days >= 0
    }

    const isDeadlinePassed = (deadline?: string) => {
        if (!deadline) return false
        return new Date(deadline) < new Date()
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
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Программы и Инвестиции</h1>
                        {isAdmin && (
                            <Button size="lg" onClick={() => router.push('/opportunities/new')} className="gap-2">
                                <PlusIcon className="h-5 w-5" />
                                Добавить
                            </Button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Поиск по названию или организации..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={handleSearch}>Найти</Button>
                    </div>

                    {/* Type Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                            <Button
                                key={value}
                                variant={selectedType === value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTypeFilter(value)}
                                className="gap-1"
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Button>
                        ))}
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {CATEGORY_OPTIONS.map((cat) => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleCategoryFilter(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    {/* Opportunities Grid */}
                    {opportunities.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="p-4 rounded-full bg-muted mb-4">
                                    <AcademicCapIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Возможности не найдены</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    Попробуйте изменить фильтры поиска или загляните позже — мы постоянно добавляем новые возможности
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {opportunities.map((opp) => {
                                const typeInfo = getTypeInfo(opp.type)
                                const TypeIcon = typeInfo.icon

                                return (
                                    <Card
                                        key={opp.id}
                                        className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                                        onClick={() => router.push(`/opportunities/${opp.id}`)}
                                    >
                                        <CardContent className="p-6">
                                            {/* Type Badge */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                                                    <TypeIcon className="h-3 w-3" />
                                                    {typeInfo.label}
                                                </span>
                                                {isDeadlineSoon(opp.deadline) && !isDeadlinePassed(opp.deadline) && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                                                        Скоро дедлайн
                                                    </span>
                                                )}
                                                {isDeadlinePassed(opp.deadline) && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                                                        Завершено
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title & Organization */}
                                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                                {opp.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-3">{opp.organization}</p>

                                            {/* Description */}
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {opp.description}
                                            </p>

                                            {/* Meta Info */}
                                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                                                {opp.amount && (
                                                    <span className="flex items-center gap-1">
                                                        <BanknotesIcon className="h-4 w-4" />
                                                        {opp.amount}
                                                    </span>
                                                )}
                                                {opp.deadline && (
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDaysIcon className="h-4 w-4" />
                                                        {format(new Date(opp.deadline), 'd MMM yyyy', { locale: ru })}
                                                    </span>
                                                )}
                                                {opp.country && (
                                                    <span className="flex items-center gap-1">
                                                        <GlobeAltIcon className="h-4 w-4" />
                                                        {opp.country}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Categories */}
                                            <div className="flex flex-wrap gap-1">
                                                {parseCategories(opp.categories).slice(0, 2).map((cat, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                                                    >
                                                        {cat}
                                                    </span>
                                                ))}
                                                {parseCategories(opp.categories).length > 2 && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                                                        +{parseCategories(opp.categories).length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
