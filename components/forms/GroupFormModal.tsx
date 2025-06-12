"use client"

import type React from "react" // Keep React import for React.FormEvent
import { useState, useEffect } from "react" // Add useEffect
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
// import { supabase } from "@/lib/supabase-client" // Remove direct Supabase client
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { useToast } from "@/hooks/use-toast" // Remove useToast
import { toast as sonnerToast } from "sonner" // Import sonner
import type { TaskGroup } from "@/types"
import { Loader2 } from "lucide-react"

interface GroupFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: TaskGroup // This is the editingGroup from the store
}

export function GroupFormModal({ open, onOpenChange, group }: GroupFormModalProps) {
  const t = useTranslations() // Initialize useTranslations
  // const { toast } = useToast() // Remove useToast initialization
  const { user, addGroup, updateGroup } = useAppStore() // user might not be needed if store handles it
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(group?.name || "")
    }
  }, [open, group])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      if (group) {
        // Update existing group
        await updateGroup(group.id, { name: name.trim() })
        // sonnerToast.success(t("groups.groupUpdatedSuccess")) // Store action might already show a toast
      } else {
        // Create new group
        // Assuming addGroup in store handles user_id and default emoji if not provided
        await addGroup({ name: name.trim(), emoji: "📁" }) // Pass emoji if store action expects it
        // sonnerToast.success(t("groups.groupCreatedSuccess")) // Store action might already show a toast
      }

      // Display success toast using internationalized strings (as per instruction, may be redundant)
      // The store actions `addGroup` and `updateGroup` already show toasts in Farsi.
      // For this exercise, we'll add the requested internationalized toasts.
      // In a real scenario, we'd choose one place (component or store) to show these.
      sonnerToast.success(group ? t("groups.groupUpdatedSuccess") : t("groups.groupCreatedSuccess"));

      setName("") // Reset name
      onOpenChange(false) // Close modal
    } catch (error) {
      console.error("Error saving group:", error)
      // Display error toast using internationalized strings
      sonnerToast.error(t("groups.groupErrorSaving"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {group ? t("groups.editGroupTitle") : t("groups.newGroupTitle")}
          </DialogTitle>
          <DialogDescription>
            {group ? t("groups.editGroupDescription") : t("groups.newGroupDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">{t("groups.groupNameLabel")}</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groups.groupNamePlaceholder")}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {group ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
