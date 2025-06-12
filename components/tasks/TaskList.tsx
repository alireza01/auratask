"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { Task, TaskGroup } from "@/types"
import { TaskCard } from "./TaskCard"
import { EmptyState } from "@/components/core/EmptyState"
import { useAppStore } from "@/lib/store"
import { CheckCircle, ListTodo } from "lucide-react"

interface TaskListProps {
  tasks: Task[]
  groups: TaskGroup[]
}

export function TaskList({ tasks, groups }: TaskListProps) {
  const { openTaskForm } = useAppStore()

  const activeTasks = tasks.filter((task) => !task.is_completed && !task.is_archived)
  const completedTasks = tasks.filter((task) => task.is_completed)

  // Sort tasks by AI ranking (importance * importance_weight + speed * speed_weight)
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    const scoreA = (a.ai_importance_score || 0) * 1.0 + (a.ai_speed_score || 0) * 1.0
    const scoreB = (b.ai_importance_score || 0) * 1.0 + (b.ai_speed_score || 0) * 1.0
    return scoreB - scoreA
  })

  return (
    <div className="space-y-6">
      {/* Active Tasks */}
      <div className="space-y-4">
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold">
          وظایف فعال
        </motion.h2>

        {sortedActiveTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="هیچ وظیفه فعالی وجود ندارد"
            description="برای شروع، اولین وظیفه خود را ایجاد کنید"
            actionLabel="ایجاد وظیفه جدید"
            onAction={() => openTaskForm()}
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedActiveTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  layout
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            وظایف تکمیل شده ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.03,
                    ease: "easeOut",
                  }}
                  layout
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  )
}
