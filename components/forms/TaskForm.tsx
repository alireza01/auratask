"use client"

import type React from "react"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Task } from "@/types"

export function TaskForm() {
  const t = useTranslations()
  const { toast } = useToast()
  const { user, addTask } = useAppStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setLoading(true)

      let taskData: Partial<Task> = {
        user_id: user!.id,
        title: title.trim(),
        description: description.trim() || null,
        speed_score: 10,
        importance_score: 10,
        emoji: "📝",
      }

      // If user has AI enabled and API key, process with AI
      if (user?.auto_ranking_enabled && user?.gemini_api_key) {
        const aiResponse = await fetch("/api/process-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            userId: user.id,
          }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          taskData = { ...taskData, ...aiData }
        }
      }

      const { data, error } = await supabase.from("tasks").insert([taskData]).select().single()

      if (error) throw error

      addTask(data as Task)
      setTitle("")
      setDescription("")
      setExpanded(false)

      toast({
        title: t("common.success"),
        description: "وظیفه با موفقیت ایجاد شد",
      })
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: t("common.error"),
        description: "خطا در ایجاد وظیفه",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("tasks.taskTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setExpanded(true)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          {expanded && (
            <div className="space-y-3">
              <Textarea
                placeholder={t("tasks.taskDescription")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              {user?.gemini_api_key && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span>هوش مصنوعی این وظیفه را تحلیل خواهد کرد</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !title.trim()}>
                  {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  {t("tasks.createTask")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setExpanded(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
