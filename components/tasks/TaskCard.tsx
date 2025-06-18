"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Task } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase-client"
import { useAppStore } from "@/lib/store"
import { Clock, Star, MoreHorizontal, CheckCircle2, ListTree, ChevronDown } from "lucide-react" // Added ListTree, ChevronDown
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible" // Added Collapsible
import { SubtaskList } from "./SubtaskList" // Added SubtaskList
import { useTranslations } from "next-intl" // Added useTranslations

interface TaskCardProps {
  task: Task
  className?: string
}

export function TaskCard({ task, className }: TaskCardProps) {
  const { toast } = useToast()
  const { updateTask } = useAppStore()
  const t = useTranslations("TaskCard") // Initialize t here
  const [loading, setLoading] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  const handleToggleComplete = async () => {
    try {
      setLoading(true)

      if (!task.is_completed) {
        setJustCompleted(true)
        // Brief delay to show the animation
        setTimeout(() => setJustCompleted(false), 1000)
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          is_completed: !task.is_completed,
        })
        .eq("id", task.id)

      if (error) throw error

      updateTask(task.id, {
        is_completed: !task.is_completed,
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وظیفه",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getSpeedColor = (score: number) => {
    if (score >= 16) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (score >= 11) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    if (score >= 6) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  }

  const getImportanceColor = (score: number) => {
    if (score >= 16) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    if (score >= 11) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    if (score >= 6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  return (
    <motion.div layout whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md relative overflow-hidden",
          task.is_completed && "opacity-60",
          className,
        )}
      >
        <AnimatePresence>
          {justCompleted && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 bg-green-500/10 flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={handleToggleComplete}
                disabled={loading}
                className="mt-1"
              />
            </motion.div>

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-lg"
                    animate={{ rotate: task.is_completed ? [0, 10, -10, 0] : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {task.emoji}
                  </motion.span>
                  <h3
                    className={cn(
                      "font-medium transition-all duration-200",
                      task.is_completed && "line-through text-muted-foreground",
                    )}
                  >
                    {task.title}
                  </h3>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {task.description && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                  {task.description}
                </motion.p>
              )}

              <motion.div
                className="flex items-center gap-2 flex-wrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {task.speed_tag && (
                  <Badge variant="secondary" className={getSpeedColor(task.ai_speed_score || 0)}>
                    <Clock className="w-3 h-3 ml-1" />
                    {task.speed_tag}
                  </Badge>
                )}
                {task.importance_tag && (
                  <Badge variant="secondary" className={getImportanceColor(task.ai_importance_score || 0)}>
                    <Star className="w-3 h-3 ml-1" />
                    {task.importance_tag}
                  </Badge>
                )}
              </motion.div>

              {/* Subtasks Section */}
              {task.subtasks && task.subtasks.length > 0 && (
                <Collapsible className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-between w-full px-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                      <span className="flex items-center">
                        <ListTree className="h-4 w-4 mr-2" />
                        {`${task.subtasks.filter(st => st.is_completed).length} / ${task.subtasks.length} ${t("subtasksComplete")}`}
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <SubtaskList subtasks={task.subtasks} taskId={task.id} />
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
