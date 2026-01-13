'use client'

import { Sidebar } from '@/components/Sidebar'

export default function CoursesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-muted/30">
            <Sidebar />
            <main className="flex-1 overflow-hidden flex flex-col">
                {children}
            </main>
        </div>
    )
}
