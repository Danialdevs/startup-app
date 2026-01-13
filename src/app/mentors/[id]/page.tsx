'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import {
    ArrowLeftIcon,
    StarIcon,
    LinkIcon,
    ChatBubbleLeftRightIcon,
    AcademicCapIcon
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

export default function MentorProfilePage() {
    const router = useRouter()
    const params = useParams()
    const { user, setUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [mentor, setMentor] = useState<Mentor | null>(null)

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

                const mentorRes = await fetch(`/api/mentors/${params.id}`)
                if (mentorRes.ok) {
                    const data = await mentorRes.json()
                    setMentor(data.mentor)
                } else {
                    router.push('/mentors')
                }
            } catch {
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, setUser, params.id])

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

    if (!mentor) {
        return null
    }

    return (
        <div className="flex h-screen bg-muted/30">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        className="mb-6 gap-2"
                        onClick={() => router.push('/mentors')}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Назад к списку
                    </Button>

                    {/* Profile Card */}
                    <Card className="mb-6">
                        <CardContent className="p-8">
                            <div className="flex items-start gap-6 mb-6">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-3xl font-semibold shrink-0">
                                    {mentor.user.avatar ? (
                                        <img src={mentor.user.avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
                                    ) : (
                                        mentor.user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h1 className="text-2xl font-bold">{mentor.user.name}</h1>
                                        {mentor.available && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                                Доступен
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <StarIcon className="h-4 w-4 text-yellow-500" />
                                            <span>{mentor.experience} лет опыта</span>
                                        </div>
                                        {mentor.hourlyRate ? (
                                            <span className="font-medium text-foreground">${mentor.hourlyRate}/час</span>
                                        ) : (
                                            <span>Бесплатные консультации</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {parseExpertise(mentor.expertise).map((exp, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
                                            >
                                                {exp}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <AcademicCapIcon className="h-5 w-5" />
                                    О менторе
                                </h2>
                                <p className="text-muted-foreground whitespace-pre-wrap">{mentor.bio}</p>
                            </div>

                            {/* Contact Buttons */}
                            <div className="flex flex-wrap gap-3 pt-6 border-t">
                                {mentor.telegram && (
                                    <Button asChild className="gap-2">
                                        <a href={`https://t.me/${mentor.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                            Написать в Telegram
                                        </a>
                                    </Button>
                                )}
                                {mentor.linkedIn && (
                                    <Button variant="outline" asChild className="gap-2">
                                        <a href={mentor.linkedIn} target="_blank" rel="noopener noreferrer">
                                            <LinkIcon className="h-4 w-4" />
                                            LinkedIn
                                        </a>
                                    </Button>
                                )}
                                <Button variant="outline" asChild className="gap-2">
                                    <a href={`mailto:${mentor.user.email}`}>
                                        Написать Email
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
