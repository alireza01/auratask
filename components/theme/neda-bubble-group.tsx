"use client"
import type { Task, TaskGroup } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NedaBubbleGroupProps {
  group: TaskGroup
  tasks: Task[]
  onClick?: () => void
}

export function NedaBubbleGroup({ group, tasks, onClick }: NedaBubbleGroupProps) {
  const completedTasks = tasks.filter((task) => task.completed).length
  const totalTasks = tasks.length
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <Card
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 bubble-float",
        "bg-gradient-to-br from-pink-100 to-purple-100 border-pink-200",
        "hover:shadow-lg hover:shadow-pink-200/50",
      )}
      onClick={onClick}
      style={{
        animationDelay: `${Math.random() * 2}s`,
        background: `linear-gradient(135deg, ${group.color}20, ${group.color}40)`,
        borderColor: `${group.color}80`,
      }}
    >
      <div className="p-6 text-center space-y-4">
        <div className="text-4xl mb-2">{group.emoji}</div>
        <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>

        <div className="space-y-2">
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="bg-white/70">
              {totalTasks} وظیفه
            </Badge>
            {completedTasks > 0 && (
              <Badge variant="default" className="bg-green-500">
                {completedTasks} تکمیل
              </Badge>
            )}
          </div>

          {totalTasks > 0 && (
            <div className="w-full bg-white/50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Floating bubbles decoration */}
        <div
          className="absolute -top-2 -right-2 w-4 h-4 bg-pink-300/30 rounded-full bubble-float"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute top-1/2 -left-1 w-3 h-3 bg-purple-300/30 rounded-full bubble-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-1 left-1/3 w-2 h-2 bg-pink-400/30 rounded-full bubble-float"
          style={{ animationDelay: "1.5s" }}
        />
      </div>
    </Card>
  )
}
