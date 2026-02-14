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
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

function LaunchpadSidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  useSearchParams()
  const { user, logout } = useStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    window.location.href = '/'
  }

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border shadow-lg"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={cn(
        "flex h-screen w-[240px] flex-col border-r bg-card fixed lg:static z-40 transition-transform duration-300",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-muted"
          aria-label="Close menu"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="text-2xl">🎓</span>
          <span className="font-semibold">Launchpad Kids</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4 px-3">
          <nav className="space-y-1">
            <Button
              variant={pathname === '/launchpad' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start gap-3 h-9",
                pathname === '/launchpad' && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              onClick={() => router.push('/launchpad')}
            >
              <HomeIcon className="h-4 w-4" />
              Панель управления
            </Button>
            <Button
              variant={pathname.startsWith('/launchpad/projects') ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start gap-3 h-9",
                pathname.startsWith('/launchpad/projects') && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              onClick={() => router.push('/launchpad/projects')}
            >
              <RocketLaunchIcon className="h-4 w-4" />
              Проекты
            </Button>
            <Button
              variant={pathname.startsWith('/launchpad/classes') ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start gap-3 h-9",
                pathname.startsWith('/launchpad/classes') && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              onClick={() => router.push('/launchpad/classes')}
            >
              <UserGroupIcon className="h-4 w-4" />
              Классы
            </Button>
          </nav>

          {/* Back to main */}
          <div className="mt-6">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Навигация
            </p>
            <nav className="mt-1 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-9"
                onClick={() => router.push('/dashboard')}
              >
                <AcademicCapIcon className="h-4 w-4" />
                Launch Pad (стартапы)
              </Button>
            </nav>
          </div>
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

export function LaunchpadSidebar() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-[240px] flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="text-2xl">🎓</span>
          <span className="font-semibold">Launchpad Kids</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <LaunchpadSidebarContent />
    </Suspense>
  )
}
