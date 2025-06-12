"use client"

// import type React from "react" // Removed unused React import
import { useState, useEffect } from "react" // Added useEffect for potential future use, kept useState
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

  const DEFAULT_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#6b7280",
  ];

  const [name, setName] = useState(editingTag?.name || "")
  const [color, setColor] = useState(editingTag?.color || DEFAULT_COLORS[0])
  const [loading, setLoading] = useState(false)

  // Effect to reset form when editingTag changes or modal opens/closes
  useEffect(() => {
    if (isTagFormOpen) {
      if (editingTag) {
        setName(editingTag.name)
        setColor(editingTag.color || DEFAULT_COLORS[0])
      } else {
        setName("")
        setColor(DEFAULT_COLORS[0])
      }
    }
  }, [isTagFormOpen, editingTag])


  const handleSubmit = async (e: React.FormEvent) => { // Ensured React.FormEvent is available or use generic Event
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
            {editingTag ? t("tags.editTagDescription") : t("tags.newTagDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">{t("tags.tagName")}</Label>
            <Input
              id="tagName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("tags.namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("tags.tagColor")}</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === colorOption ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                  aria-label={`${t("tags.selectColor")} ${colorOption}`}
                />
              ))}
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
