"use client"

import { motion } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ListTodo, Calendar, Star, CheckCircle } from "lucide-react"

interface TaskTabsProps {
  tasks: any[]
}

export function TaskTabs({ tasks }: TaskTabsProps) {
  const { activeTab, setActiveTab } = useAppStore()

  const tabs = [
    {
      id: "all" as const,
      label: "همه",
      icon: ListTodo,
      count: tasks.filter((t) => !t.is_archived).length,
    },
    {
      id: "today" as const,
      label: "امروز",
      icon: Calendar,
      count: tasks.filter((t) => {
        if (t.is_archived) return false
        const today = new Date().toDateString()
        return t.due_date && new Date(t.due_date).toDateString() === today
      }).length,
    },
    {
      id: "important" as const,
      label: "مهم",
      icon: Star,
      count: tasks.filter((t) => !t.is_archived && (t.ai_importance_score || 0) >= 15).length,
    },
    {
      id: "completed" as const,
      label: "تکمیل شده",
      icon: CheckCircle,
      count: tasks.filter((t) => t.is_completed && !t.is_archived).length,
    },
  ]

  return (
    <div className="relative">
      <div className="flex space-x-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <Badge variant="secondary" className="h-5 text-xs">
                  {tab.count}
                </Badge>
              )}

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
