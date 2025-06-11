"use client"

import { useState } from "react"
import type { Task, User } from "@/types"
import { TaskCard } from "./task-card"

interface ArchiveViewProps {
  tasks: Task[]
  user: User | null
  onTasksChange: () => void
}

export default function ArchiveView({ tasks, user, onTasksChange }: ArchiveViewProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUnarchive = async (taskId: string) => {
    setIsLoading(true)
    try {
      // Handle unarchive logic here
      onTasksChange()
    } catch (error) {
      console.error("Error unarchiving task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (taskId: string, completed: boolean) => {
    // Handle task completion logic here
    onTasksChange()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Archived Tasks</h2>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={handleComplete}
            onUpdate={onTasksChange}
          />
        ))}
      </div>
    </div>
  )
}
