"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Trophy } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export function UsernameModal() {
  const t = useTranslations("usernameModal")
  const { updateUsername, closeUsernameModal } = useAppStore()
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || username.length < 3) {
      toast.error(t("toastErrorMinLength"))
      return
    }

    try {
      setLoading(true)
      await updateUsername(username.trim())
    } catch (error) {
      console.error("Error updating username:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center">{t("title")}</DialogTitle>
          <DialogDescription className="text-center">{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("label")}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("placeholder")}
              minLength={3}
              maxLength={15}
              required
            />
            <p className="text-xs text-muted-foreground">{t("helperText")}</p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !username.trim()} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {t("submitButton")}
            </Button>
            <Button type="button" variant="outline" onClick={closeUsernameModal}>
              {t("cancelButton")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
