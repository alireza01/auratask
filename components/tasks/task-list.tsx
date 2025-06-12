"use client"
import type { Task } from "@/types"
import { TaskCard } from "./task-card"
import { ArchivedTasks } from "./archived-tasks"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations } from "next-intl"

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const t = useTranslations("tasks")
  const activeTasks = tasks.filter((task) => !task.completed)

  // Sort tasks by AI ranking (importance * importance_weight + speed * speed_weight)
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    const scoreA = (a.importance_score || 0) * 1.0 + (a.speed_score || 0) * 1.0
    const scoreB = (b.importance_score || 0) * 1.0 + (b.speed_score || 0) * 1.0
    return scoreB - scoreA
  })

  return (
    <div className="space-y-6">
      {/* Active Tasks */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">وظایف فعال</h2>
        {sortedActiveTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <div className="space-y-2">
                <p className="text-lg font-medium">{t("noTasks")}</p>
                <p className="text-sm">{t("noTasksDescription")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedActiveTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Archived/Completed Tasks */}
      <ArchivedTasks />
    </div>
  )
}
