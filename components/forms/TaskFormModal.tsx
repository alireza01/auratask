"use client"

// import type React from "react" // Removed unused React import

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CalendarIcon, Sparkles, X, Brain, Target } from "lucide-react"
import { format } from "date-fns"
// import { fa } from "date-fns/locale" // Removed Farsi locale for date-fns
import { toast as sonnerToast } from "sonner"

export function TaskFormModal() {
  const t = useTranslations()
  const { isTaskFormOpen, closeTaskForm, editingTask, addTask, updateTask, groups, tags, settings } = useAppStore()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [groupId, setGroupId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [enableAiRanking, setEnableAiRanking] = useState(true)
  const [enableAiSubtasks, setEnableAiSubtasks] = useState(true)
  const [loading, setLoading] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title)
      setDescription(editingTask.description || "")
      setGroupId(editingTask.group_id)
      setDueDate(editingTask.due_date ? new Date(editingTask.due_date) : undefined)
      setSelectedTags(editingTask.tags?.map((tag) => tag.id) || [])
      setEnableAiRanking(editingTask.enable_ai_ranking ?? true)
      setEnableAiSubtasks(editingTask.enable_ai_subtasks ?? true)
    } else {
      setTitle("")
      setDescription("")
      setGroupId(null)
      setDueDate(undefined)
      setSelectedTags([])
      setEnableAiRanking(true)
      setEnableAiSubtasks(true)
    }
  }, [editingTask, isTaskFormOpen])

  const handleSubmit = async (e: React.FormEvent) => { // React.FormEvent should be fine
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      let taskData: any = {
        title: title.trim(),
        description: description.trim() || null,
        group_id: groupId,
        due_date: dueDate?.toISOString(),
        enable_ai_ranking: enableAiRanking,
        enable_ai_subtasks: enableAiSubtasks,
        emoji: "📝",
      }

      // If user has AI enabled and API key, process with AI
      if (settings?.gemini_api_key && !editingTask && (enableAiRanking || enableAiSubtasks)) {
        setAiProcessing(true)
        try {
          const aiResponse = await fetch("/api/process-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim(),
              enable_ai_ranking: enableAiRanking,
              enable_ai_subtasks: enableAiSubtasks,
            }),
          })

          if (aiResponse.ok) {
            const aiData = await aiResponse.json()
            taskData = { ...taskData, ...aiData }
          }
        } catch (error) {
          console.error("AI processing failed:", error)
        } finally {
          setAiProcessing(false)
        }
      }

      if (editingTask) {
        await updateTask(editingTask.id, taskData)
        sonnerToast.success(t("tasks.taskUpdatedSuccess"))
      } else {
        await addTask(taskData)
        sonnerToast.success(t("tasks.taskCreatedSuccess"))
      }

      closeTaskForm()
    } catch (error) {
      console.error("Error saving task:", error)
      sonnerToast.error(t("tasks.taskErrorSaving"))
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  return (
    <Dialog open={isTaskFormOpen} onOpenChange={closeTaskForm}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {editingTask ? t("tasks.editTask") : t("tasks.newTask")}
          </DialogTitle>
          <DialogDescription>
            {editingTask ? t("tasks.editTaskDescription") : t("tasks.newTaskWithAiDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="taskTitle">{t("tasks.taskTitle")}</Label>
            <Input
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("tasks.titlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskDescription">{t("tasks.taskDescription")}</Label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("tasks.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("groups.groupName")}</Label>
              <Select value={groupId || ""} onValueChange={(value) => setGroupId(value === "no-group" ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("groups.selectGroupPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-group">{t("groups.noGroup")}</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.emoji} {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("tasks.dueDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : t("tasks.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>{t("tags.manageTags")}</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                    {selectedTags.includes(tag.id) && <X className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {settings?.gemini_api_key && !editingTask && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <Label className="text-base font-medium">{t("tasks.aiSettingsLabel")}</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <Label className="font-medium">{t("tasks.aiRankingLabel")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("tasks.aiRankingDescription")}</p>
                    </div>
                    <Switch checked={enableAiRanking} onCheckedChange={setEnableAiRanking} />
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <Label className="font-medium">{t("tasks.aiSubtasksLabel")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("tasks.aiSubtasksDescription")}</p>
                    </div>
                    <Switch checked={enableAiSubtasks} onCheckedChange={setEnableAiSubtasks} />
                  </div>
                </div>

                {(enableAiRanking || enableAiSubtasks) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                    <span>{t("tasks.aiWillProcessTask")}</span>
                    {aiProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={closeTaskForm}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingTask ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
