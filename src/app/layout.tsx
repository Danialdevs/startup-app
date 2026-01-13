import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "LaunchPad - Платформа для стартапов",
  description: "Платформа для запуска и развития стартапов",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
