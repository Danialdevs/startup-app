'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { StartupChat } from '@/components/StartupChat'
import { useStore } from '@/store/useStore'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Startup {
  id: string
  name: string
}

export default function StartupChatPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser, setStartups } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

        const startupsRes = await fetch('/api/startups')
        if (startupsRes.ok) {
          const startupsData = await startupsRes.json()
          setStartups(startupsData.startups)
        }

        const startupRes = await fetch(`/api/startups/${params.id}`)
        if (!startupRes.ok) {
          router.push('/dashboard')
          return
        }
        const startupData = await startupRes.json()
        setStartup(startupData.startup)
      } catch (error) {
        console.error('Page error:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser, setStartups])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />
      
      <main className="flex-1 overflow-hidden flex flex-col lg:ml-0">
        {/* Header */}
        <div className="border-b bg-card p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold">AI Ассистент</h1>
          </div>
        </div>

        {/* Chat Component - Full Height */}
        <div className="flex-1 min-h-0 p-4 sm:p-6">
          {startup?.id && (
            <div className="max-w-5xl mx-auto h-full">
              <StartupChat
                startupId={startup.id}
                isOpen={true}
                onClose={() => router.push(`/startup/${startup.id}`)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
