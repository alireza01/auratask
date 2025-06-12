import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/core/ErrorBoundary"
import { CommandPalette } from "@/components/core/CommandPalette"
import { LevelUpNotification } from "@/components/gamification/LevelUpNotification"
import { AchievementUnlockNotification } from "@/components/gamification/AchievementUnlockNotification"
import { AuraNotification } from "@/components/gamification/aura-notification"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AuraTask - Smart Task Management",
  description: "AI-powered task management with gamification",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AuraTask",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AuraTask",
    title: "AuraTask - Smart Task Management",
    description: "AI-powered task management with gamification",
  },
  twitter: {
    card: "summary",
    title: "AuraTask - Smart Task Management",
    description: "AI-powered task management with gamification",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Satoshi:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <div className="relative min-h-screen">
                {/* Theme Backgrounds */}
                <div id="theme-background" className="fixed inset-0 -z-10" />

                {/* Main Content */}
                <main className="relative z-10">{children}</main>

                {/* Global Components */}
                <CommandPalette />
                <LevelUpNotification />
                <AchievementUnlockNotification />
                <AuraNotification />
                <Toaster />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
