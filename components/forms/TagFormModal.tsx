"use client"

import type React from "react"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function TagFormModal() {
  const t = useTranslations()
  const { isTagFormOpen, closeTagForm, editingTag, addTag, updateTag } = useAppStore()
  const [name, setName] = useState(editingTag?.name || "")
  const [color, setColor] = useState(editingTag?.color || "#6366f1")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      if (editingTag) {
        await updateTag(editingTag.id, { name: name.trim(), color })
      } else {
        await addTag({ name: name.trim(), color })
      }
      closeTagForm()
    } catch (error) {
      console.error("Error saving tag:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isTagFormOpen} onOpenChange={closeTagForm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTag ? t("tags.editTag") : t("tags.newTag")}</DialogTitle>
          <DialogDescription>
            {editingTag ? "ویرایش برچسب موجود" : "ایجاد برچسب جدید برای سازماندهی وظایف"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">{t("tags.tagName")}</Label>
            <Input
              id="tagName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: کار، شخصی، مهم"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagColor">{t("tags.tagColor")}</Label>
            <div className="flex gap-2">
              <Input
                id="tagColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
                placeholder="#HEX"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={closeTagForm}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingTag ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
