"use client"

import { useState } from "react"
import type { Task, TaskGroup } from "@/types"
import { NedaBubbleGroup } from "@/components/theme/NedaBubbleGroup"
import { TaskCard } from "@/components/tasks/TaskCard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { GroupFormModal } from "@/components/forms/GroupFormModal"

interface TaskGroupsBubblesProps {
  groups: TaskGroup[]
  tasks: Task[]
}

export function TaskGroupsBubbles({ groups, tasks }: TaskGroupsBubblesProps) {
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const ungroupedTasks = tasks.filter((task) => !task.group_id)
  const groupedTasks = groups.map((group) => ({
    ...group,
    tasks: tasks.filter((task) => task.group_id === group.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">گروه‌های وظایف</h2>
        <Button onClick={() => setShowGroupForm(true)}>
          <Plus className="w-4 h-4 ml-2" />
          گروه جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedTasks.map((group) => (
          <NedaBubbleGroup
            key={group.id}
            group={group}
            tasks={group.tasks}
            onClick={() => setSelectedGroup(group.id)}
          />
        ))}
      </div>

      {ungroupedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">وظایف بدون گروه</h3>
          <div className="grid gap-3">
            {ungroupedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      <GroupFormModal open={showGroupForm} onOpenChange={setShowGroupForm} />
    </div>
  )
}
