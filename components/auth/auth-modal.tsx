"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, User } from "lucide-react"

interface AuthModalProps {
  onGuestContinue: () => void
}

export function AuthModal({ onGuestContinue }: AuthModalProps) {
  const t = useTranslations()
  const [loading, setLoading] = React.useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error("Error signing in:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">{t("app.title")}</CardTitle>
          <CardDescription>{t("app.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoogleSignIn} disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            {t("auth.signIn")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">یا</span>
            </div>
          </div>

          <Button variant="outline" onClick={onGuestContinue} className="w-full" size="lg">
            <User className="ml-2 h-4 w-4" />
            {t("auth.signInAsGuest")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
