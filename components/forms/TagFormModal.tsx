"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase-client"

interface TagFormModalProps {
  isOpen: boolean
  onClose: () => void
  tagToEdit?: {
    id: string
    name: string
    color: string
  }
}

const DEFAULT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#6b7280", // gray
]

export function TagFormModal({ isOpen, onClose, tagToEdit }: TagFormModalProps) {
  const router = useRouter()
  const [name, setName] = useState(tagToEdit?.name || "")
  const [color, setColor] = useState(tagToEdit?.color || DEFAULT_COLORS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = getSupabaseClient()

    try {
      if (tagToEdit) {
        // Update existing tag
        const { error } = await supabase.from("tags").update({ name, color }).eq("id", tagToEdit.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Tag updated successfully",
        })
      } else {
        // Create new tag
        const { error } = await supabase.from("tags").insert({ name, color })

        if (error) throw error

        toast({
          title: "Success",
          description: "Tag created successfully",
        })
      }

      router.refresh()
      onClose()
    } catch (error) {
      console.error("Error saving tag:", error)
      toast({
        title: "Error",
        description: "Failed to save tag",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tagToEdit ? "Edit Tag" : "Create New Tag"}</DialogTitle>
          <DialogDescription>
            {tagToEdit ? "Update the tag details below." : "Add a new tag to organize your tasks."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tag Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tag name"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
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
                    aria-label={`Select color ${colorOption}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : tagToEdit ? "Update Tag" : "Create Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Export the component as a named export
