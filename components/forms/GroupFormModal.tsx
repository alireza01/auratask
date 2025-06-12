"use client"

import type React from "react"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
// import { supabase } from "@/lib/supabase-client" // No longer needed
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { useToast } from "@/hooks/use-toast" // No longer needed, store handles toasts
// import type { TaskGroup } from "@/types" // No longer needed for props
import { Loader2 } from "lucide-react"
import { useEffect } from "react" // Import useEffect

// interface GroupFormModalProps { // No longer needed
// open: boolean
// onOpenChange: (open: boolean) => void
// group?: TaskGroup
// }

export function GroupFormModal() {
  const t = useTranslations()
  // const { toast } = useToast() // Store handles toasts
  const { isGroupFormOpen, closeGroupForm, editingGroup, addGroup, updateGroup, user } = useAppStore() // Get user for addGroup default emoji if needed, though store handles user_id
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name || "")
    } else {
      setName("") // Reset for new group
    }
  }, [editingGroup, isGroupFormOpen]) // Depend on isGroupFormOpen to reset when modal reopens for new

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, { name: name.trim() })
      } else {
        // The store's addGroup action will handle setting user_id/guest_id
        // and other defaults like created_at.
        // We just need to provide the core data.
        await addGroup({ name: name.trim(), emoji: "📁" }) // Default emoji, store might allow customization later
      }
      // Toasts are handled by store actions.
      // setName("") // Not strictly necessary as closeGroupForm will reset editingGroup which triggers useEffect
      closeGroupForm()
    } catch (error) {
      console.error("Error saving group:", error)
      // Toasts for errors are also expected to be handled by store actions.
    } finally {
      setLoading(false)
    }
  }

  // Do not render if not open, though Dialog handles this with its `open` prop
  if (!isGroupFormOpen) {
    return null
  }

  return (
    <Dialog open={isGroupFormOpen} onOpenChange={closeGroupForm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingGroup ? "ویرایش گروه" : "ایجاد گروه جدید"}</DialogTitle>
          <DialogDescription>
            {editingGroup ? "نام گروه را ویرایش کنید" : "گروه جدید برای سازماندهی وظایف ایجاد کنید"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">نام گروه</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: کار، شخصی، خرید"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={closeGroupForm}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingGroup ? "به‌روزرسانی" : "ایجاد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
