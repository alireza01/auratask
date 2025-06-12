"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useAppStore } from "@/lib/store"
import type { User } from "@/types"
import { AuthModal } from "./AuthModal"
import { ApiKeySetupGuide } from "./ApiKeySetupGuide"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading } = useAppStore()
  const [showAuth, setShowAuth] = useState(false)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setShowAuth(true)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserProfile(session.user.id)
        setShowAuth(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setShowAuth(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user && !user.gemini_api_key) {
      setShowApiKeySetup(true)
    }
  }, [user])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) throw error
      setUser(data as User)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  if (showAuth) {
    return <AuthModal />
  }

  if (showApiKeySetup) {
    return <ApiKeySetupGuide onComplete={() => setShowApiKeySetup(false)} />
  }

  return <>{children}</>
}
