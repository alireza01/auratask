"use client"
import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User, Task, TaskGroup, UserSettings, Tag, GuestUser, Theme } from '@/types'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useAppStore } from '@/lib/store/appStore'
import Header from '@/components/header'
import TaskList from '@/components/task-list'
import AddTaskModal from '@/components/add-task-modal'
import EditTaskModal from '@/components/edit-task-modal'
import SignInPromptModal from '@/components/signin-prompt-modal'
import ApiKeySetup from '@/components/api-key-setup'
import SettingsPanel from '@/components/settings/settings-panel'
import TagsModal from '@/components/tags-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useToast } from '@/components/ui/use-toast'
import { v4 as uuidv4 } from 'uuid'
import { Search, TagIcon, X, Filter, Calendar, Star, CheckCircle2, LayoutDashboard, Plus } from 'lucide-react'
import StatsDashboard from '@/components/stats-dashboard'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import TaskGroupsBubbles from '@/components/task-groups-bubbles'
import TaskFormModal from '@/components/task-form-modal'

interface TaskDashboardProps {
  user: User | null
}

export default function TaskDashboard({ user }: TaskDashboardProps) {
  // Get state and actions from the store
  const {
    tasks,
    groups,
    tags,
    settings,
    isLoading,
    initialize,
    updateTask,
    addTask,
    deleteTask,
    addGroup,
    updateGroup,
    deleteGroup,
    updateSettings
  } = useAppStore((state) => ({
    tasks: state.tasks,
    groups: state.groups,
    tags: state.tags,
    settings: state.settings,
    isLoading: state.isLoading,
    initialize: state.initialize,
    updateTask: state.updateTask,
    addTask: state.addTask,
    deleteTask: state.deleteTask,
    addGroup: state.addGroup,
    updateGroup: state.updateGroup,
    deleteGroup: state.deleteGroup,
    updateSettings: state.updateSettings,
  }))

  // UI State
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(false)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Filters
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "active">("all")
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all")
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Local Storage
  const [hasShownSignInPrompt, setHasShownSignInPrompt] = useLocalStorage("has-shown-signin-prompt", false)
  const [localGuestUser, setLocalGuestUser] = useLocalStorage<GuestUser | null>("aura-guest-user", null)

  const { toast } = useToast()

  // Drag and Drop Functionality
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return // No valid drop target

    if (active.data.current?.type === "group" && active.id !== over.id) {
      // Reorder groups
      const oldIndex = groups.findIndex((group) => group.id === active.id)
      const newIndex = groups.findIndex((group) => group.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newGroups = arrayMove(groups, oldIndex, newIndex)
        // Update group order in store
        newGroups.forEach((group: TaskGroup, index: number) => {
          updateGroup(supabase, group.id, { order_index: index } as Partial<TaskGroup>)
        })
      }
    } else if (active.data.current?.type === "task") {
      const taskId = active.id as string;
      const overId = over.id as string;
      const currentTask = tasks.find((t) => t.id === taskId);
      const overTask = tasks.find((t) => t.id === overId);

      if (!currentTask || !overTask) return;

      const oldGroupId = currentTask.group_id;
      let newGroupId: string | null = overTask.group_id || null;

      // Determine if dropping onto a group bubble
      if (over.data.current?.type === "group-container") {
        newGroupId = over.id as string;
      }

      // Case 1: Reordering within the same group
      if (oldGroupId === newGroupId) {
        const tasksInGroup = tasks
          .filter((t) => t.group_id === oldGroupId)
          .sort((a, b) => a.order_index - b.order_index);

        const oldIndex = tasksInGroup.findIndex((t) => t.id === taskId);
        const newIndex = tasksInGroup.findIndex((t) => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedTasks = arrayMove(tasksInGroup, oldIndex, newIndex);

          // Update order_index for all affected tasks
          reorderedTasks.forEach((task: Task, index: number) => {
            updateTask(supabase, task.id, { order_index: index } as Partial<Task>)
          })
        }
      } else {
        // Case 2: Moving to a different group
        const tasksInNewGroup = tasks.filter(t => t.group_id === newGroupId && t.id !== taskId);
        const newOrderIndex = tasksInNewGroup.length; // Place at the end

        updateTask(supabase, taskId, { 
          group_id: newGroupId, 
          order_index: newOrderIndex 
        } as Partial<Task>)
      }
    }

    setActiveId(null)
    setIsDragging(false)
  }

  const handleTaskDrop = (taskId: string, groupId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const tasksInNewGroup = tasks.filter(t => t.group_id === groupId && t.id !== taskId)
    const newOrderIndex = tasksInNewGroup.length

    updateTask(supabase, taskId, {
      group_id: groupId,
      order_index: newOrderIndex
    } as Partial<Task>)
  }

  const handleGroupsChange = async () => {
    await initialize(supabase)
  }

  const handleSettingsChange = async () => {
    if (user) {
      // The theme is updated directly via the settings panel, which calls updateSettings
      // No need to use selectedTheme state here as it's now managed by the store's settings
    }
  }

  const handleTagsChange = async () => {
    if (user) {
      await initialize(supabase)
    }
  }

  // Initialize guest user if needed
  useEffect(() => {
    if (!user && !localGuestUser) {
      const newGuestUser: GuestUser = {
        id: uuidv4(),
        email: `guest_${Math.floor(Math.random() * 10000)}@auratask.local`,
        created_at: new Date().toISOString(),
      }
      setLocalGuestUser(newGuestUser)
    }
  }, [user, localGuestUser, setLocalGuestUser])

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGroup = !filterGroup || task.group_id === filterGroup
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "completed" && task.completed) ||
        (filterStatus === "active" && !task.completed)
      const matchesPriority = filterPriority === "all" || task.importance_score === (filterPriority === "high" ? 1 : filterPriority === "medium" ? 0.5 : 0)
      const matchesTag = !filterTag || task.tags?.some(tag => tag.id === filterTag)

      return matchesSearch && matchesGroup && matchesStatus && matchesPriority && matchesTag
    })
  }, [tasks, searchQuery, filterGroup, filterStatus, filterPriority, filterTag])

  // Initialize store
  useEffect(() => {
    const initStore = async () => {
      try {
        await initialize(supabase)
      } catch (error) {
        console.error('Failed to initialize store:', error)
        toast({
          title: "خطا در بارگذاری داده‌ها",
          description: "مشکلی در بارگذاری داده‌ها رخ داد. لطفاً صفحه را رفرش کنید.",
          variant: "destructive"
        })
      }
    }
    initStore()
  }, [initialize, toast])

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!user) return

    const tasksChannel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            updateTask(supabase, payload.new.id, payload.new as Task)
          } else if (payload.eventType === "UPDATE") {
            updateTask(supabase, payload.new.id, payload.new as Task)
          } else if (payload.eventType === "DELETE") {
            deleteTask(supabase, payload.old.id)
          }
        },
      )
      .subscribe()

    const subtasksChannel = supabase
      .channel("public:subtasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks" }, // Subtasks don't have user_id, need to filter by task_id later if needed
        async (payload: any) => { // Type any for subtasks as they are not directly Task type
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
            // Re-fetch tasks to ensure subtasks are updated correctly
            // A more granular update could be implemented, but re-fetching is simpler for now
            await initialize(supabase)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(subtasksChannel)
    }
  }, [user, updateTask, deleteTask, initialize])

  const applyFilters = useCallback(() => {
    let result = [...tasks]

    // Apply tab filter
    if (activeTab === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      result = result.filter((task) => {
        const taskDate = new Date(task.created_at)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() === today.getTime()
      })
    } else if (activeTab === "important") {
      result = result.filter((task) => (task.importance_score || 0) >= 15)
    } else if (activeTab === "completed") {
      result = result.filter((task) => task.completed)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)),
      )
    }

    // Apply group filter
    if (filterGroup) {
      result = result.filter((task) => task.group_id === filterGroup)
    }

    // Apply status filter
    if (filterStatus === "completed") {
      result = result.filter((task) => task.completed)
    } else if (filterStatus === "active") {
      result = result.filter((task) => !task.completed)
    }

    // Apply priority filter
    if (filterPriority === "high") {
      result = result.filter((task) => (task.importance_score || 0) >= 15)
    } else if (filterPriority === "medium") {
      result = result.filter((task) => {
        const score = task.importance_score || 0
        return score >= 8 && score < 15
      })
    } else if (filterPriority === "low") {
      result = result.filter((task) => (task.importance_score || 0) < 8)
    }

    // Apply tag filter
    if (filterTag) {
      result = result.filter((task) => task.tags?.some((tag) => tag.id === filterTag))
    }

    return result
  }, [tasks, searchQuery, filterGroup, filterStatus, filterPriority, filterTag, activeTab])

  // Apply filters whenever tasks or filter criteria change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleAddTask = useCallback(() => {
    if (!user && !hasShownSignInPrompt && tasks.length === 0) {
      setShowSignInPrompt(true)
      setHasShownSignInPrompt(true)
    } else {
      setShowAddTask(true)
    }
  }, [user, hasShownSignInPrompt, tasks.length, setHasShownSignInPrompt])

  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task)
    setShowEditTask(true)
  }, [])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    // Optimistic update
    const originalTasks = tasks
    deleteTask(supabase, taskId)

    try {
      toast({
        title: "وظیفه حذف شد",
        description: "وظیفه با موفقیت حذف شد.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      updateTask(supabase, taskId, originalTasks.find(t => t.id === taskId) as Task) // Revert on error
      toast({
        title: "خطا در حذف وظیفه",
        description: "مشکلی در حذف وظیفه رخ داد.",
        variant: "destructive",
      })
    }
  }, [user, tasks, deleteTask, updateTask, toast])

  const completeTask = useCallback(async (taskId: string, completed: boolean) => {
    // Optimistic update
    const originalTasks = tasks
    updateTask(supabase, taskId, { 
      completed, 
      completed_at: completed ? new Date().toISOString() : null 
    } as Partial<Task>)

    try {
      toast({
        title: completed ? "وظیفه تکمیل شد" : "وظیفه به حالت قبل بازگشت",
        description: completed ? "وظیفه با موفقیت تکمیل شد." : "وظیفه به حالت قبل بازگشت.",
      })
    } catch (error) {
      console.error("Error completing task:", error)
      updateTask(supabase, taskId, originalTasks.find(t => t.id === taskId) as Task) // Revert on error
      toast({
        title: "خطا در تغییر وضعیت وظیفه",
        description: "مشکلی در تغییر وضعیت وظیفه رخ داد.",
        variant: "destructive",
      })
    }
  }, [user, tasks, updateTask, toast])

  const handleTaskAdded = useCallback(async () => {
    await initialize(supabase) // Realtime will handle this, but keep for initial load consistency
  }, [user, initialize])

  const clearFilters = useCallback(() => {
    setSearchQuery("")
    setFilterGroup(null)
    setFilterStatus("all")
    setFilterPriority("all")
    setFilterTag(null)
  }, [])

  const hasActiveFilters = searchQuery || filterGroup || filterStatus !== "all" || filterPriority !== "all" || filterTag

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="loading-dots flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onSettingsChange={() => setShowSettings(true)}
        onSearch={setSearchQuery}
      />

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {localGuestUser && !user
              ? "سلام، مهمان"
              : `سلام${user?.user_metadata?.name ? "، " + user.user_metadata.name : ""}`}
          </h1>
          <p className="text-muted-foreground">
            {filteredTasks.filter((t) => !t.completed).length} وظیفه در انتظار انجام
          </p>
        </div>

        {/* Task Creation */}
        <Button onClick={handleAddTask} className="mb-4 w-full md:w-auto">
          <Plus className="h-4 w-4 ml-2" />
          افزودن وظیفه جدید
        </Button>

        <TaskGroupsBubbles
          user={user}
          guestUser={localGuestUser}
          groups={groups}
          selectedGroup={filterGroup}
          onGroupSelect={setFilterGroup}
          onGroupsChange={handleGroupsChange}
          onTaskDrop={handleTaskDrop}
          getTaskCountForGroup={(groupId) => tasks.filter((t) => t.group_id === groupId && !t.completed).length}
        />

        {/* Tabs and Filters */}
        <div className="mb-6 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-background">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  همه
                </TabsTrigger>
                <TabsTrigger value="today" className="data-[state=active]:bg-background">
                  <Calendar className="h-4 w-4 mr-1" />
                  امروز
                </TabsTrigger>
                <TabsTrigger value="important" className="data-[state=active]:bg-background">
                  <Star className="h-4 w-4 mr-1" />
                  مهم
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-background">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  تکمیل شده
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowTags(true)}>
                  <TagIcon className="h-4 w-4" />
                  <span className="hidden md:inline">برچسب‌ها</span>
                </Button>
                <Button
                  variant={showFilters ? "secondary" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden md:inline">فیلترها</span>
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-muted/30 rounded-lg p-4 mb-4">
                    <div className="flex flex-wrap gap-3">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="جستجو..."
                          className="pr-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Group Filter */}
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[150px]"
                        value={filterGroup || ""}
                        onChange={(e) => setFilterGroup(e.target.value || null)}
                      >
                        <option value="">همه گروه‌ها</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.emoji} {group.name}
                          </option>
                        ))}
                      </select>

                      {/* Status Filter */}
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[150px]"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                      >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="active">در انتظار انجام</option>
                        <option value="completed">تکمیل شده</option>
                      </select>

                      {/* Priority Filter */}
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[150px]"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as any)}
                      >
                        <option value="all">همه اولویت‌ها</option>
                        <option value="high">اولویت بالا</option>
                        <option value="medium">اولویت متوسط</option>
                        <option value="low">اولویت پایین</option>
                      </select>

                      {/* Tag Filter */}
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[150px]"
                        value={filterTag || ""}
                        onChange={(e) => setFilterTag(e.target.value || null)}
                      >
                        <option value="">همه برچسب‌ها</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.emoji} {group.name}
                          </option>
                        ))}
                      </select>

                      {/* Clear Filters */}
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                          <X className="h-4 w-4" />
                          پاک کردن فیلترها
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value="all" className="mt-0">
              {activeTab === "all" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <TaskList
                      tasks={filteredTasks}
                      groups={groups}
                      settings={settings}
                      user={user}
                      onTasksChange={() => initialize(supabase)}
                      onGroupsChange={handleGroupsChange}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onComplete={completeTask}
                    />
                  </div>
                  <div className="hidden lg:block">
                    <StatsDashboard tasks={tasks} />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="today" className="mt-0">
              <TaskList
                tasks={filteredTasks}
                groups={groups}
                settings={settings}
                user={user}
                onTasksChange={() => initialize(supabase)}
                onGroupsChange={handleGroupsChange}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onComplete={completeTask}
              />
            </TabsContent>

            <TabsContent value="important" className="mt-0">
              <TaskList
                tasks={filteredTasks}
                groups={groups}
                settings={settings}
                user={user}
                onTasksChange={() => initialize(supabase)}
                onGroupsChange={handleGroupsChange}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onComplete={completeTask}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <TaskList
                tasks={filteredTasks}
                groups={groups}
                settings={settings}
                user={user}
                onTasksChange={() => initialize(supabase)}
                onGroupsChange={handleGroupsChange}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onComplete={completeTask}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modals */}
      {showAddTask && (
        <TaskFormModal
          user={user}
          guestUser={localGuestUser}
          groups={groups}
          tags={tags}
          settings={settings}
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          onTaskSaved={handleTaskAdded}
          initialTitle={""}
        />
      )}

      {showEditTask && taskToEdit && (
        <TaskFormModal
          user={user}
          guestUser={localGuestUser}
          groups={groups}
          tags={tags}
          settings={settings}
          isOpen={showEditTask}
          onClose={() => {
            setShowEditTask(false)
            setTaskToEdit(null)
          }}
          onTaskSaved={handleTaskAdded}
          taskToEdit={taskToEdit}
        />
      )}

      {showSignInPrompt && (
        <SignInPromptModal onClose={() => setShowSignInPrompt(false)} onSignIn={() => setShowSignInPrompt(false)} />
      )}

      {user && showApiKeySetup && (
        <ApiKeySetup onComplete={() => setShowApiKeySetup(false)} onSkip={() => setShowApiKeySetup(false)} />
      )}

      {showSettings && (
        <SettingsPanel
          user={user || localGuestUser}
          settings={settings}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {showTags && (
        <TagsModal
          user={user}
          guestUser={localGuestUser}
          tags={tags}
          onClose={() => setShowTags(false)}
          onTagsChange={handleTagsChange}
        />
      )}
    </div>
  )
}
