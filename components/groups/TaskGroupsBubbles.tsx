"use client"

import { useState } from "react"
import type { Task, TaskGroup } from "@/types"
import { NedaBubbleGroup } from "@/components/theme/NedaBubbleGroup"
import { TaskCard } from "@/components/tasks/TaskCard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { GroupFormModal } from "@/components/forms/GroupFormModal"

interface TaskGroupsBubblesProps {
  groups: TaskGroup[]
  tasks: Task[]
}

export function TaskGroupsBubbles({ groups, tasks }: TaskGroupsBubblesProps) {
  const t = useTranslations("taskGroupsBubbles")
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
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <Button onClick={() => setShowGroupForm(true)}>
          <Plus className="w-4 h-4 ml-2" />
          {t("newGroupButton")}
        </Button>
      </div>

      {/* The NedaBubbleGroup component handles rendering all groups in its canvas */}
      <NedaBubbleGroup
        groups={groups}
        tasks={tasks}
        onGroupClick={setSelectedGroup}
      />

      {/* Display tasks that are not part of any bubble/group */}
      {selectedGroup === null && ungroupedTasks.length > 0 && (
        <div className="mt-6 space-y-4"> {/* Added margin top for separation */}
          <h3 className="text-lg font-semibold">{t("ungroupedTasksTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"> {/* Added responsive grid for cards */}
            {ungroupedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* TODO: When a group is selected (selectedGroup !== null),
           filter and display tasks belonging to that group here, perhaps using TaskCard as well.
           This part is not explicitly in the original request but is a logical next step.
           For now, only ungrouped tasks are shown when no group is selected.
      */}


      <GroupFormModal open={showGroupForm} onOpenChange={setShowGroupForm} />
    </div>
  )
}
