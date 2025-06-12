"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { supabase } from "@/lib/supabase-client"
import { AuthModal } from "@/components/auth/AuthModal"
import { ApiKeySetupGuide } from "@/components/auth/ApiKeySetupGuide"
import { TaskDashboard } from "@/components/core/TaskDashboard"
import { UsernameModal } from "@/components/auth/UsernameModal"
import { DashboardSkeleton } from "@/components/core/DashboardSkeleton"
import { motion } from "framer-motion"

export default function HomePage() {
  const {
    user,
    guestId,
    setUser,
    setGuestId,
    settings,
    fetchInitialData,
    migrateGuestData,
    isLoading,
    isUsernameModalOpen,
  } = useAppStore()

  const [showAuth, setShowAuth] = useState(false)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for existing session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // If we have a guest ID, migrate the data
          if (guestId) {
            await migrateGuestData()
          }
        } else {
          // No user session, continue as guest
          if (!guestId) {
            const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            setGuestId(newGuestId)
          }
        }

        // Fetch initial data
        await fetchInitialData()
      } catch (error) {
        console.error("Error initializing app:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    initializeApp()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)

        // If we have guest data, migrate it
        if (guestId) {
          await migrateGuestData()
        } else {
          await fetchInitialData()
        }

        setShowAuth(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        // Don't show auth modal immediately, let them continue as guest
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setGuestId, guestId, fetchInitialData, migrateGuestData])

  useEffect(() => {
    // Show API key setup if user is authenticated and has no API key
    if (user && settings && !settings.gemini_api_key) {
      setShowApiKeySetup(true)
    } else {
      setShowApiKeySetup(false)
    }
  }, [user, settings])

  if (initialLoading || isLoading) {
    return <DashboardSkeleton />
  }

  if (showAuth) {
    return <AuthModal onGuestContinue={() => setShowAuth(false)} onClose={() => setShowAuth(false)} />
  }

  if (showApiKeySetup) {
    return <ApiKeySetupGuide onComplete={() => setShowApiKeySetup(false)} onSkip={() => setShowApiKeySetup(false)} />
  }

  return (
    <>
      <TaskDashboard />

      {/* Show auth prompt for guests */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <button
            onClick={() => setShowAuth(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
          >
            ورود با حساب کاربری
          </button>
        </motion.div>
      )}

      {/* Username modal for new users */}
      {isUsernameModalOpen && <UsernameModal />}
    </>
  )
}
