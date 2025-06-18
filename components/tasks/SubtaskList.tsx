"use client"

import type { Subtask } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslations } from "next-intl"


interface SubtaskListProps {
  subtasks: Subtask[]
  taskId: string // Needed for some store actions, though toggle/delete use subtaskId directly
}

export function SubtaskList({ subtasks, taskId }: SubtaskListProps) {
  const { toggleSubtaskComplete, deleteSubtask } = useAppStore()
  const t = useTranslations("TaskCard")
  const tToast = useTranslations("ToastNotifications")

  if (!subtasks || subtasks.length === 0) {
    return null
  }

  const handleToggle = (subtaskId: string) => {
    // Parameters for awardAura within toggleSubtaskComplete
    const subtaskCompletionReason = tToast("SubtaskCompletion.reason");
    const auraAwardTitle = tToast("AuraAward.title");
    const closeButtonLabel = tToast("AuraAward.closeButton");
    toggleSubtaskComplete(subtaskId, subtaskCompletionReason, auraAwardTitle, closeButtonLabel);
  }

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center justify-between group">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`subtask-${subtask.id}`}
              checked={subtask.is_completed}
              onCheckedChange={() => handleToggle(subtask.id)}
              aria-label={`Mark subtask ${subtask.title} as ${subtask.is_completed ? "incomplete" : "complete"}`}
            />
            <label
              htmlFor={`subtask-${subtask.id}`}
              className={`text-sm ${subtask.is_completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`}
            >
              {subtask.title}
            </label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteSubtask(subtask.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Delete subtask ${subtask.title}`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  )
}
