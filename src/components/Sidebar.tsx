'use client'

import { Suspense, useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import {
  HomeIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  GiftIcon,
  SparklesIcon,
  ChartBarIcon,
  MapIcon,
  LightBulbIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  FolderIcon,
  ScaleIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  startupId?: string
  startupName?: string
}

function SidebarContent({ startupId, startupName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const isAnalysisTab = (tab: string) => {
    return searchParams.get('tab') === tab
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    window.location.href = '/'
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border shadow-lg"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex h-screen w-[240px] flex-col border-r bg-card fixed lg:static z-40 transition-transform duration-300",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-muted"
          aria-label="Close menu"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
        <span className="font-semibold">Launch Pad</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4 px-3">
        <nav className="space-y-1">
          <Button
            variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3 h-9",
              pathname === '/dashboard' && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => router.push('/dashboard')}
          >
            <HomeIcon className="h-4 w-4" />
            Главная
          </Button>
          <Button
            variant={pathname === '/mentors' || pathname.startsWith('/mentors/') ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3 h-9",
              (pathname === '/mentors' || pathname.startsWith('/mentors/')) && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => router.push('/mentors')}
          >
            <AcademicCapIcon className="h-4 w-4" />
            Менторы
          </Button>
          <Button
            variant={pathname === '/opportunities' || pathname.startsWith('/opportunities/') ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3 h-9",
              (pathname === '/opportunities' || pathname.startsWith('/opportunities/')) && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => router.push('/opportunities')}
          >
            <GiftIcon className="h-4 w-4" />
            Программы
          </Button>
          <Button
            variant={pathname === '/articles' || pathname.startsWith('/articles/') ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3 h-9",
              (pathname === '/articles' || pathname.startsWith('/articles/')) && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => router.push('/articles')}
          >
            <DocumentTextIcon className="h-4 w-4" />
            Статьи
          </Button>
          <Button
            variant={pathname === '/courses' || pathname.startsWith('/courses/') ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3 h-9",
              (pathname === '/courses' || pathname.startsWith('/courses/')) && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => router.push('/courses')}
          >
            <BookOpenIcon className="h-4 w-4" />
            Курсы
          </Button>
          <Button
            variant={pathname.startsWith('/launchpad') ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3 h-9",
              pathname.startsWith('/launchpad') && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => router.push('/launchpad')}
          >
            <LightBulbIcon className="h-4 w-4" />
            Launchpad Kids
          </Button>
        </nav>

        {/* Current Startup Navigation */}
        {startupId && (
          <div className="mt-6">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {startupName || 'Проект'}
            </p>
            <nav className="mt-1 space-y-1">
              <Button
                variant={pathname === `/startup/${startupId}` && !isAnalysisTab('summary') && !isAnalysisTab('market') && !isAnalysisTab('roadmap') && !isAnalysisTab('resources') ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  pathname === `/startup/${startupId}` && !isAnalysisTab('summary') && !isAnalysisTab('market') && !isAnalysisTab('roadmap') && !isAnalysisTab('resources') && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}`)}
              >
                <RocketLaunchIcon className="h-4 w-4" />
                Обзор
              </Button>
              <Button
                variant={pathname === `/startup/${startupId}/team` ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  pathname === `/startup/${startupId}/team` && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}/team`)}
              >
                <UserGroupIcon className="h-4 w-4" />
                Команда
              </Button>
              <Button
                variant={pathname === `/startup/${startupId}/tasks` ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  pathname === `/startup/${startupId}/tasks` && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}/tasks`)}
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Задачи
              </Button>
              <Button
                variant={pathname === `/startup/${startupId}/finance` ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  pathname === `/startup/${startupId}/finance` && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}/finance`)}
              >
                <BanknotesIcon className="h-4 w-4" />
                Финансы
              </Button>
              <Button
                variant={pathname === `/startup/${startupId}/documents` ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  pathname === `/startup/${startupId}/documents` && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}/documents`)}
              >
                <FolderIcon className="h-4 w-4" />
                Документы
              </Button>
              <Button
                variant={pathname === `/startup/${startupId}/custdev` || pathname.startsWith(`/startup/${startupId}/custdev/`) ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  (pathname === `/startup/${startupId}/custdev` || pathname.startsWith(`/startup/${startupId}/custdev/`)) && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}/custdev`)}
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                CustDev
              </Button>
              <Button
                variant={pathname === `/startup/${startupId}/chat` ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  pathname === `/startup/${startupId}/chat` && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}/chat`)}
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                AI Ассистент
              </Button>
            </nav>

            {/* Analysis Report Section - Always show */}
            <p className="px-3 py-2 mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              AI Отчёт
            </p>
            <nav className="mt-1 space-y-1">
              <Button
                variant={isAnalysisTab('summary') ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  isAnalysisTab('summary') && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}?tab=summary`)}
              >
                <SparklesIcon className="h-4 w-4" />
                Резюме
              </Button>
              <Button
                variant={isAnalysisTab('market') ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  isAnalysisTab('market') && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}?tab=market`)}
              >
                <ChartBarIcon className="h-4 w-4" />
                Анализ рынка
              </Button>
              <Button
                variant={isAnalysisTab('roadmap') ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  isAnalysisTab('roadmap') && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}?tab=roadmap`)}
              >
                <MapIcon className="h-4 w-4" />
                Дорожная карта
              </Button>
              <Button
                variant={isAnalysisTab('resources') ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  isAnalysisTab('resources') && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}?tab=resources`)}
              >
                <BookOpenIcon className="h-4 w-4" />
                Ресурсы
              </Button>
              <Button
                variant={pathname === `/startup/${startupId}/contributions` ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  pathname === `/startup/${startupId}/contributions` && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                onClick={() => router.push(`/startup/${startupId}/contributions`)}
              >
                <ScaleIcon className="h-4 w-4" />
                Вклад команды
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <nav className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9"
            onClick={() => router.push('/settings')}
          >
            <Cog6ToothIcon className="h-4 w-4" />
            Настройки
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Выйти
          </Button>
        </nav>
      </div>
    </div>
    </>
  )
}

export function Sidebar({ startupId, startupName }: SidebarProps) {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-[240px] flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
          <span className="font-semibold">Launch Pad</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <SidebarContent startupId={startupId} startupName={startupName} />
    </Suspense>
  )
}
