"use client"
import { useAppStore } from "@/lib/store"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { ListTodo, Calendar, Star, CheckCircle } from "lucide-react"

interface TaskTabsProps {
  tasks: any[]
}

export function TaskTabs({ tasks }: TaskTabsProps) {
  const t = useTranslations("tabs")
  const { activeTab, setActiveTab } = useAppStore()

  const tabs = [
    {
      id: "all" as const,
      label: t("all"),
      icon: ListTodo,
      count: tasks.filter((task: any) => !task.is_archived).length,
    },
    {
      id: "today" as const,
      label: t("today"),
      icon: Calendar,
      count: tasks.filter((task: any) => {
        if (task.is_archived) return false
        const today = new Date().toDateString()
        return task.due_date && new Date(task.due_date).toDateString() === today
      }).length,
    },
    {
      id: "important" as const,
      label: t("important"),
      icon: Star,
      count: tasks.filter((task: any) => !task.is_archived && (task.ai_importance_score || 0) >= 15).length,
    },
    {
      id: "completed" as const,
      label: t("completed"),
      icon: CheckCircle,
      count: tasks.filter((task: any) => task.is_completed && !task.is_archived).length,
    },
  ]

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
