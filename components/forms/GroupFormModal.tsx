"use client"

import type React from "react"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import { supabase } from "@/lib/supabase-client"
import { generateGroupEmoji } from "@/lib/ai-utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { TaskGroup } from "@/types"
import { Loader2 } from "lucide-react"

interface GroupFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: TaskGroup
}

export function GroupFormModal({ open, onOpenChange, group }: GroupFormModalProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const { user, addGroup, updateGroup } = useAppStore()
  const [name, setName] = useState(group?.name || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setLoading(true)

      if (group) {
        // Update existing group
        const { error } = await supabase.from("task_groups").update({ name: name.trim() }).eq("id", group.id)

        if (error) throw error
        updateGroup(group.id, { name: name.trim() })
      } else {
        // Create new group
        const emoji = await generateGroupEmoji(name.trim(), "#BCA9F0", user!.id); // Assuming a default color or add color selection later
        const { data, error } = await supabase
          .from("task_groups")
          .insert([
            {
              user_id: user!.id,
              name: name.trim(),
              emoji: emoji,
            },
          ])
          .select()
          .single()

        if (error) throw error
        addGroup(data as TaskGroup)
      }

      toast({
        title: t("common.success"),
        description: group ? "گروه با موفقیت به‌روزرسانی شد" : "گروه با موفقیت ایجاد شد",
      })

      setName("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving group:", error)
      toast({
        title: t("common.error"),
        description: "خطا در ذخیره گروه",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group ? "ویرایش گروه" : "ایجاد گروه جدید"}</DialogTitle>
          <DialogDescription>
            {group ? "نام گروه را ویرایش کنید" : "گروه جدید برای سازماندهی وظایف ایجاد کنید"}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {group ? "به‌روزرسانی" : "ایجاد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
