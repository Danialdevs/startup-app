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
import {
    PlusIcon,
    MagnifyingGlassIcon,
    AcademicCapIcon,
    StarIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Mentor {
    id: string
    bio: string
    expertise: string
    experience: number
    hourlyRate?: number
    available: boolean
    linkedIn?: string
    telegram?: string
    user: {
        id: string
        name: string
        email: string
        avatar?: string
    }
}

const EXPERTISE_OPTIONS = [
    'Стартапы',
    'Маркетинг',
    'Продукт',
    'Разработка',
    'Финансы',
    'Продажи',
    'HR',
    'Юридические вопросы',
    'Инвестиции',
    'Growth Hacking'
]

export default function MentorsPage() {
    const router = useRouter()
    const { user, setUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null)

    // View Modal state
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)


    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingMentorId, setEditingMentorId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        bio: '',
        expertise: [] as string[],
        experience: 0,
        hourlyRate: '',
        linkedIn: '',
        telegram: '',
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

                await fetchMentors()
            } catch {
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, setUser])

    const fetchMentors = async (expertise?: string, search?: string) => {
        try {
            const params = new URLSearchParams()
            if (expertise) params.set('expertise', expertise)
            if (search) params.set('search', search)

            const res = await fetch(`/api/mentors?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setMentors(data.mentors)
            }
        } catch {
            console.error('Error fetching mentors')
        }
    }

    const handleSearch = () => {
        fetchMentors(selectedExpertise || undefined, searchQuery || undefined)
    }

    const handleExpertiseFilter = (exp: string) => {
        const newExpertise = selectedExpertise === exp ? null : exp
        setSelectedExpertise(newExpertise)
        fetchMentors(newExpertise || undefined, searchQuery || undefined)
    }

    const toggleExpertise = (exp: string) => {
        setFormData(prev => ({
            ...prev,
            expertise: prev.expertise.includes(exp)
                ? prev.expertise.filter(e => e !== exp)
                : [...prev.expertise, exp]
        }))
    }

    const openBecomeMentorModal = () => {
        setIsEditing(false)
        setEditingMentorId(null)
        setFormData({ bio: '', expertise: [], experience: 0, hourlyRate: '', linkedIn: '', telegram: '' })
        setIsModalOpen(true)
    }

    const openEditMentorModal = (mentor: Mentor) => {
        setIsEditing(true)
        setEditingMentorId(mentor.id)
        setFormData({
            bio: mentor.bio,
            expertise: parseExpertise(mentor.expertise),
            experience: mentor.experience,
            hourlyRate: mentor.hourlyRate?.toString() || '',
            linkedIn: mentor.linkedIn || '',
            telegram: mentor.telegram || '',
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.bio || formData.expertise.length === 0) {
            setError('Заполните обязательные поля')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const url = isEditing && editingMentorId ? `/api/mentors/${editingMentorId}` : '/api/mentors'
            const method = isEditing ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    bio: formData.bio,
                    expertise: formData.expertise,
                    experience: formData.experience,
                    hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
                    linkedIn: formData.linkedIn || null,
                    telegram: formData.telegram || null,
                })
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Ошибка')
                return
            }

            setIsModalOpen(false)
            setFormData({ bio: '', expertise: [], experience: 0, hourlyRate: '', linkedIn: '', telegram: '' })
            await fetchMentors()
            setIsEditing(false)
            setEditingMentorId(null)
        } catch {
            setError('Ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    const parseExpertise = (expertiseStr: string): string[] => {
        try {
            return JSON.parse(expertiseStr)
        } catch {
            return []
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const currentUserMentor = mentors.find(m => m.user.id === user?.id)

    const handleViewMentor = (mentor: Mentor) => {
        setSelectedMentor(mentor)
    }

    return (
        <div className="flex h-screen bg-muted/30">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Менторы</h1>
                        </div>
                        {currentUserMentor ? (
                            <Button size="lg" onClick={() => openEditMentorModal(currentUserMentor)} variant="outline" className="gap-2">
                                <PlusIcon className="h-5 w-5" />
                                Редактировать профиль
                            </Button>
                        ) : (
                            <Button size="lg" onClick={openBecomeMentorModal} className="gap-2">
                                <PlusIcon className="h-5 w-5" />
                                Стать ментором
                            </Button>
                        )}
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск по имени..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-9"
                                />
                            </div>
                            <Button onClick={handleSearch}>Найти</Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {EXPERTISE_OPTIONS.map((exp) => (
                                <Button
                                    key={exp}
                                    variant={selectedExpertise === exp ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleExpertiseFilter(exp)}
                                >
                                    {exp}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Mentors Grid */}
                    {mentors.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="p-4 rounded-full bg-muted mb-4">
                                    <AcademicCapIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Менторы не найдены</h3>
                                <p className="text-muted-foreground mb-6 text-center max-w-md">
                                    Станьте первым ментором на платформе и помогайте начинающим предпринимателям
                                </p>
                                <Button size="lg" onClick={openBecomeMentorModal}>
                                    <PlusIcon className="mr-2 h-5 w-5" />
                                    Стать ментором
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mentors.map((mentor) => (
                                <Card
                                    key={mentor.id}
                                    className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                                    onClick={() => handleViewMentor(mentor)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-semibold">
                                                {mentor.user.avatar ? (
                                                    <img src={mentor.user.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                                                ) : (
                                                    mentor.user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                    {mentor.user.name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <StarIcon className="h-4 w-4 text-yellow-500" />
                                                    <span>{mentor.experience} лет опыта</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                            {mentor.bio}
                                        </p>

                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {parseExpertise(mentor.expertise).slice(0, 3).map((exp, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                                                >
                                                    {exp}
                                                </span>
                                            ))}
                                            {parseExpertise(mentor.expertise).length > 3 && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                                                    +{parseExpertise(mentor.expertise).length - 3}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            {mentor.hourlyRate ? (
                                                <span className="text-sm font-medium">${mentor.hourlyRate}/час</span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Бесплатно</span>
                                            )}
                                            <Button size="sm" variant="ghost" className="gap-1">
                                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                Связаться
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Become Mentor Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{isEditing ? 'Редактировать профиль' : 'Стать ментором'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Обновите информацию о себе' : 'Заполните информацию о себе, чтобы помогать начинающим предпринимателям'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>О себе *</Label>
                            <Textarea
                                placeholder="Расскажите о своём опыте и чем вы можете помочь..."
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Области экспертизы *</Label>
                            <div className="flex flex-wrap gap-2">
                                {EXPERTISE_OPTIONS.map((exp) => (
                                    <Button
                                        key={exp}
                                        type="button"
                                        variant={formData.expertise.includes(exp) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleExpertise(exp)}
                                    >
                                        {exp}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Опыт (лет)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Стоимость ($/час)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="Бесплатно"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>LinkedIn</Label>
                            <Input
                                placeholder="https://linkedin.com/in/..."
                                value={formData.linkedIn}
                                onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Telegram</Label>
                            <Input
                                placeholder="@username"
                                value={formData.telegram}
                                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Сохранить изменения' : 'Стать ментором'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Mentor Modal */}
            <Dialog open={!!selectedMentor} onOpenChange={(open) => !open && setSelectedMentor(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedMentor && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-semibold">
                                        {selectedMentor.user.avatar ? (
                                            <img src={selectedMentor.user.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
                                        ) : (
                                            selectedMentor.user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl">{selectedMentor.user.name}</DialogTitle>
                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                            <StarIcon className="h-4 w-4 text-yellow-500" />
                                            <span>{selectedMentor.experience} лет опыта</span>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold mb-2">О себе</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedMentor.bio}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Экспертиза</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {parseExpertise(selectedMentor.expertise).map((exp, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 text-sm rounded-full bg-primary/10 text-primary"
                                            >
                                                {exp}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-muted/50">
                                        <p className="text-sm text-muted-foreground mb-1">Стоимость обучения</p>
                                        <p className="font-semibold text-lg">
                                            {selectedMentor.hourlyRate ? `$${selectedMentor.hourlyRate}/час` : 'Бесплатно'}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/50">
                                        <p className="text-sm text-muted-foreground mb-1">Статус</p>
                                        <p className="font-semibold text-lg flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                            Готов к работе
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Контакты</h4>
                                    <div className="flex gap-2">
                                        {selectedMentor.telegram && (
                                            <Button variant="outline" className="gap-2" asChild>
                                                <a href={`https://t.me/${selectedMentor.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                                    </svg>
                                                    Telegram
                                                </a>
                                            </Button>
                                        )}
                                        {selectedMentor.linkedIn && (
                                            <Button variant="outline" className="gap-2" asChild>
                                                <a href={selectedMentor.linkedIn} target="_blank" rel="noopener noreferrer">
                                                    LinkedIn
                                                </a>
                                            </Button>
                                        )}
                                        <Button className="gap-2 ml-auto">
                                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                            Написать сообщение
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
