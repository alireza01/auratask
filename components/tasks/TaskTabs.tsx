"use client"

import { useAppStore } from "@/lib/store"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Inbox, Clock, Star, CheckCircle2 } from "lucide-react"
import type { Task } from "@/types" // Import Task type

interface TaskTabsProps {
  tasks: Task[] // Use specific Task type
}

export function TaskTabs({ tasks }: TaskTabsProps) {
  const t = useTranslations("tabs") // Assuming "tabs" is a namespace in next-intl
  const { activeTab, setActiveTab } = useAppStore()

  const tabDefinitions = [
    {
      id: "all" as const,
      labelKey: "all",
      icon: Inbox,
      count: tasks.filter((task) => !task.is_archived).length,
    },
    {
      id: "today" as const,
      labelKey: "today",
      icon: Clock,
      count: tasks.filter((task) => {
        if (task.is_archived) return false
        // Ensure due_date is valid before creating a Date object
        return task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString()
      }).length,
    },
    {
      id: "important" as const,
      labelKey: "important",
      icon: Star,
      // Ensure ai_importance_score is present and not null before comparison
      count: tasks.filter((task) => !task.is_archived && (task.ai_importance_score ?? 0) >= 15).length,
    },
    {
      id: "completed" as const,
      labelKey: "completed",
      icon: CheckCircle2,
      count: tasks.filter((task) => task.is_completed && !task.is_archived).length,
    },
  ]

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {tabDefinitions.map((tab) => {
          const IconComponent = tab.icon
          return (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <IconComponent className="w-4 h-4" />
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              {tab.count > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs sm:ml-1">
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
