"use client"

import React from "react"
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useAppStore } from "@/lib/store"

// Import child components
import { Header } from "./Header"
import { TaskGroupsBubbles } from "@/components/groups/TaskGroupsBubbles"
import { TaskList } from "@/components/tasks/TaskList"
import { StatsDashboard } from "@/components/stats/StatsDashboard"
import { TaskTabs } from "@/components/tasks/TaskTabs"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import { TaskFormModal } from "@/components/forms/TaskFormModal"
import { GroupFormModal } from "@/components/forms/GroupFormModal"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { TagFormModal } from "@/components/forms/TagFormModal"

export function TaskDashboard() {
  const {
    user,
    tasks,
    groups,
    settings,
    isLoading,
    activeTab,
    filters,
    showFilters,
    reorderTasks,
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
        result = result.filter((task) => task.ai_importance_score && task.ai_importance_score >= 16)
        break
      case "completed":
        result = result.filter((task) => task.is_completed)
        break
      default:
        result = result.filter((task) => !task.is_completed && !task.is_archived)
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
      result = result.filter((task) => (filters.filterStatus === "completed" ? task.is_completed : !task.is_completed))
    }

    // Apply priority filter
    if (filters.filterPriority !== "all") {
      result = result.filter((task) => {
        if (!task.ai_importance_score) return false
        switch (filters.filterPriority) {
          case "high":
            return task.ai_importance_score >= 16
          case "medium":
            return task.ai_importance_score >= 6 && task.ai_importance_score < 16
          case "low":
            return task.ai_importance_score < 6
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

  const theme = settings?.theme || "default"

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={`min-h-screen bg-background theme-${theme}`}>
        <Header />

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Neda Theme Bubbles */}
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
