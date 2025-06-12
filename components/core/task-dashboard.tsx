"use client"
import * as React from "react"
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useAppStore } from "@/lib/store"
import { useTheme } from "@/components/theme/theme-provider"

// Import child components
import { Header } from "@/components/core/header"
import { TaskGroupsBubbles } from "@/components/groups/task-groups-bubbles"
import { TaskList } from "@/components/tasks/task-list"
import { StatsDashboard } from "@/components/stats/stats-dashboard"
import { TaskTabs } from "@/components/tasks/task-tabs"
import { TaskFilters } from "@/components/tasks/task-filters"
import { TaskFormModal } from "@/components/forms/task-form-modal"
import { GroupFormModal } from "@/components/forms/group-form-modal"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { TagFormModal } from "@/components/forms/tag-form-modal"

export function TaskDashboard() {
  const { theme } = useTheme()
  const {
    user,
    tasks,
    groups,
    isLoading,
    activeTab,
    filters,
    showFilters,
    reorderTasks,
    moveTaskToGroup,
    isTaskFormOpen,
    isGroupFormOpen,
    isTagFormOpen,
    isSettingsPanelOpen,
  } = useAppStore()

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  // Filter tasks based on active tab and filters
  const filteredTasks = React.useMemo(() => {
    let result = [...tasks]

    // Filter by tab
    switch (activeTab) {
      case "today":
        const today = new Date().toDateString()
        result = result.filter((task) => task.due_date && new Date(task.due_date).toDateString() === today)
        break
      case "important":
        result = result.filter((task) => task.importance_score && task.importance_score >= 16)
        break
      case "completed":
        result = result.filter((task) => task.completed)
        break
      default:
        result = result.filter((task) => !task.completed)
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(
        (task) => task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query),
      )
    }

    // Apply group filter
    if (filters.filterGroup) {
      result = result.filter((task) => task.group_id === filters.filterGroup)
    }

    // Apply status filter
    if (filters.filterStatus !== "all") {
      result = result.filter((task) => (filters.filterStatus === "completed" ? task.completed : !task.completed))
    }

    // Apply priority filter
    if (filters.filterPriority !== "all") {
      result = result.filter((task) => {
        if (!task.importance_score) return false
        switch (filters.filterPriority) {
          case "high":
            return task.importance_score >= 16
          case "medium":
            return task.importance_score >= 6 && task.importance_score < 16
          case "low":
            return task.importance_score < 6
          default:
            return true
        }
      })
    }

    // Apply tag filter
    if (filters.filterTag) {
      result = result.filter((task) => task.tags?.some((tag) => tag.id === filters.filterTag))
    }

    return result
  }, [tasks, activeTab, filters])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredTasks.findIndex((t) => t.id === active.id)
    const newIndex = filteredTasks.findIndex((t) => t.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(filteredTasks, oldIndex, newIndex)
      reorderTasks(reordered)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={`min-h-screen bg-background theme-${theme}`}>
        <Header />

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Task Groups Bubbles (Neda theme only) */}
          {theme === "neda" && <TaskGroupsBubbles groups={groups} tasks={tasks} />}

          {/* Main Content */}
          <div className="space-y-6">
            {/* Tabs */}
            <TaskTabs />

            {/* Filters */}
            {showFilters && <TaskFilters />}

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TaskList tasks={filteredTasks} />
              </div>
              <div className="hidden lg:block">
                <StatsDashboard />
              </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        {isTaskFormOpen && <TaskFormModal />}
        {isGroupFormOpen && <GroupFormModal />}
        {isTagFormOpen && <TagFormModal />}
        {isSettingsPanelOpen && <SettingsPanel />}
      </div>
    </DndContext>
  )
}
