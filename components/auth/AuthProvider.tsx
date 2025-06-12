"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { useAppStore } from "@/lib/store"
import type { User } from "@/types"
import { AuthModal } from "./AuthModal"
import { ApiKeySetupGuide } from "./ApiKeySetupGuide"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, setUser, fetchInitialData, settings } = useAppStore()
  const [showAuth, setShowAuth] = React.useState(false)
  const [showApiKeySetup, setShowApiKeySetup] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as User)
      } else {
        // Sign in anonymously for guest users
        supabase.auth.signInAnonymously().then(({ data, error }) => {
          if (error) {
            console.error("Error signing in anonymously:", error)
            setShowAuth(true)
          } else if (data.user) {
            setUser(data.user as User)
          }
        })
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const newUser = session.user as User
        setUser(newUser)

        // Check for guest data migration
        const guestUserId = sessionStorage.getItem("guestUserId")
        if (guestUserId && guestUserId !== newUser.id) {
          try {
            await fetch("/api/migrate-guest-data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                new_user_id: newUser.id,
                guest_user_id: guestUserId,
              }),
            })
            sessionStorage.removeItem("guestUserId")
          } catch (error) {
            console.error("Error migrating guest data:", error)
          }
        }

        setShowAuth(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setShowAuth(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  React.useEffect(() => {
    if (user) {
      fetchInitialData()
    }
  }, [user, fetchInitialData])

  React.useEffect(() => {
    // Show API key setup if user is authenticated (not anonymous) and has no API key
    if (user && !user.is_anonymous && settings && !settings.gemini_api_key) {
      setShowApiKeySetup(true)
    } else {
      setShowApiKeySetup(false)
    }
  }, [user, settings])

  const handleGuestToAuth = () => {
    if (user?.is_anonymous) {
      sessionStorage.setItem("guestUserId", user.id)
    }
    setShowAuth(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (showAuth) {
    return <AuthModal onGuestContinue={() => setShowAuth(false)} />
  }

  if (showApiKeySetup) {
    return <ApiKeySetupGuide onComplete={() => setShowApiKeySetup(false)} onSkip={() => setShowApiKeySetup(false)} />
  }

  return (
    <>
      {children}
      {user?.is_anonymous && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleGuestToAuth}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
          >
            ورود با حساب کاربری
          </button>
        </div>
      )}
    </>
  )
}
