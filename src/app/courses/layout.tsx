'use client'

import { Suspense } from 'react'
import { Sidebar } from '@/components/Sidebar'

export default function CoursesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-muted/30">
            <Suspense fallback={
                <div className="hidden lg:flex h-screen w-[240px] flex-col border-r bg-card">
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
                <Sidebar />
            </Suspense>
            <main className="flex-1 overflow-hidden flex flex-col lg:ml-0">
                {children}
            </main>
        </div>
    )
}
