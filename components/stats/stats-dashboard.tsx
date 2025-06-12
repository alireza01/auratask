"use client"
import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, Star } from "lucide-react"
import { useTranslations } from "next-intl"

export function StatsDashboard() {
  const t = useTranslations("stats")
  const tasks = useAppStore((state) => state.tasks)

  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completed).length
    const activeTasks = totalTasks - completedTasks
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Calculate overdue tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueTasks = tasks.filter((t) => {
      if (t.completed || !t.due_date) return false
      const dueDate = new Date(t.due_date)
      return dueDate < today
    }).length

    // Calculate due today
    const dueTodayTasks = tasks.filter((t) => {
      if (t.completed || !t.due_date) return false
      const dueDate = new Date(t.due_date)
      return dueDate.toDateString() === today.toDateString()
    }).length

    // High priority tasks
    const highPriorityTasks = tasks.filter((t) => !t.completed && (t.importance_score || 0) >= 16).length

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      completionRate,
      overdueTasks,
      dueTodayTasks,
      highPriorityTasks,
    }
  }, [tasks])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("statistics")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Tasks */}
            <div className="flex flex-col">
              <p className="text-muted-foreground text-sm">{t("totalTasks")}</p>
              <p className="text-2xl font-bold">{stats.totalTasks}</p>
            </div>

            {/* Completed Tasks */}
            <div className="flex flex-col">
              <p className="text-muted-foreground text-sm">{t("completedTasks")}</p>
              <p className="text-2xl font-bold">{stats.completedTasks}</p>
            </div>

            {/* Pending Tasks */}
            <div className="flex flex-col">
              <p className="text-muted-foreground text-sm">{t("pendingTasks")}</p>
              <p className="text-2xl font-bold">{stats.activeTasks}</p>
            </div>

            {/* Overdue Tasks */}
            <div className="flex flex-col">
              <p className="text-muted-foreground text-sm">{t("overdueTasks")}</p>
              <p className="text-2xl font-bold text-destructive">{stats.overdueTasks}</p>
            </div>
          </div>

          {/* Completion Rate */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t("completionRate")}</span>
              <span>{Math.round(stats.completionRate)}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>

          {/* Today's Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t("todayProgress")}</span>
              <span>{stats.dueTodayTasks > 0 ? `${stats.dueTodayTasks} ${t("dueToday")}` : "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 flex items-center gap-1">
                {Array.from({ length: Math.min(stats.dueTodayTasks, 5) }).map((_, i) => (
                  <div key={i} className="h-2 flex-1 bg-primary rounded-full" />
                ))}
                {Array.from({ length: Math.max(5 - stats.dueTodayTasks, 0) }).map((_, i) => (
                  <div key={i} className="h-2 flex-1 bg-muted rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* High Priority */}
          {stats.highPriorityTasks > 0 && (
            <div className="flex items-center gap-2 text-amber-500">
              <Star className="w-4 h-4" />
              <span className="text-sm">
                {stats.highPriorityTasks} {t("importanceTags.high")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
