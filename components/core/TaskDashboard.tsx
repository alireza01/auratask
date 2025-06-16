"use client"

import { useMemo } from "react" // Changed from import React
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useAppStore } from "@/lib/store"
import { useTheme } from "next-themes"; // Added useTheme

// Import child components (assuming PascalCase filenames)
import { Header } from "./Header" // Assumes Header.tsx
import { TaskGroupsBubbles } from "@/components/groups/TaskGroupsBubbles" // Assumes TaskGroupsBubbles.tsx
import { TaskList } from "@/components/tasks/TaskList" // Assumes TaskList.tsx
import { StatsDashboard } from "@/components/stats/StatsDashboard" // Assumes StatsDashboard.tsx
import { TaskTabs } from "@/components/tasks/task-tabs" // Corrected import path
import { TaskFilters } from "@/components/tasks/TaskFilters" // Assumes TaskFilters.tsx
import { TaskFormModal } from "@/components/forms/TaskFormModal" // Assumes TaskFormModal.tsx
import { GroupFormModal } from "@/components/forms/GroupFormModal" // Assumes GroupFormModal.tsx
import { SettingsPanel } from "@/components/settings/SettingsPanel" // Assumes SettingsPanel.tsx
import { TagFormModal } from "@/components/forms/TagFormModal" // Assumes TagFormModal.tsx

export function TaskDashboard() {
  const {
    user,
    tasks,
    groups,
    // settings, // settings will be removed as theme comes from useTheme
    isLoading,
    activeTab,
    filters,
    showFilters,
    reorderTasks,
    moveTaskToGroup, // Added moveTaskToGroup
    isTaskFormOpen,
    isGroupFormOpen,
    isTagFormOpen,
    isSettingsPanelOpen,
    closeGroupForm, // Added
    editingGroup    // Added
  } = useAppStore()

  const { theme } = useTheme(); // Added theme from useTheme

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  // Filter tasks based on active tab and filters
  const filteredTasks = useMemo(() => { // Changed from React.useMemo
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

    // Check if the drag is for moving to a group (if groups are draggable targets)
    // This part depends on how DND is set up for groups vs tasks.
    // For now, assuming this handleDragEnd is primarily for task reordering within the list.
    // If groups are drop targets, 'over.data.current.type' might distinguish.

    const oldIndex = filteredTasks.findIndex((t) => t.id === active.id)
    const newIndex = filteredTasks.findIndex((t) => t.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(filteredTasks, oldIndex, newIndex)
      reorderTasks(reordered) // This reorders within the current view/filter
    }
    // Logic for moveTaskToGroup would typically be handled if 'over' is a group
    // and 'active' is a task. Example:
    // if (over.data.current?.type === 'group' && active.data.current?.type === 'task') {
    //   moveTaskToGroup(active.id as string, over.id as string);
    // }
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

  // const theme = settings?.theme || "default"; // Removed, theme comes from useTheme()

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
            <TaskTabs tasks={tasks} />

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
        {isGroupFormOpen && <GroupFormModal open={isGroupFormOpen} onOpenChange={closeGroupForm} group={editingGroup} />}
        {isTagFormOpen && <TagFormModal />}
        {isSettingsPanelOpen && <SettingsPanel />}
      </div>
    </DndContext>
  )
}
