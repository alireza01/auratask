"use client"
import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User, Task, GuestUser } from '@/types'
import { useAppStore } from '@/lib/store/appStore'
import Header from '@/components/header'
import TaskList from '@/components/task-list'
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
import TaskGroupsBubbles from '@/components/task-groups-bubbles'
import TaskFormModal from './tasks/task-form-modal'

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
    deleteTask,
  } = useAppStore((state) => ({
    tasks: state.tasks,
    groups: state.groups,
    tags: state.tags,
    settings: state.settings,
    isLoading: state.isLoading,
    initialize: state.initialize,
    updateTask: state.updateTask,
    deleteTask: state.deleteTask,
    updateGroup: state.updateGroup,
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

  // Filters
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "active">("all")
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all")
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Local Storage
  const [hasShownSignInPrompt, setHasShownSignInPrompt] = useLocalStorage("has-shown-signin-prompt", false)
  const [localGuestUser, setLocalGuestUser] = useLocalStorage<GuestUser | null>("aura-guest-user", null)

  const { toast } = useToast()

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
  }, [])

  // Memoize the update handlers
  const handleTaskUpdate = useCallback(async (taskId: string, updatedFields: Partial<Task>) => {
    try {
      await updateTask(supabase, taskId, updatedFields)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }, [updateTask])

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await deleteTask(supabase, taskId)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }, [deleteTask])

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
            handleTaskUpdate(payload.new.id, payload.new as Task)
          } else if (payload.eventType === "UPDATE") {
            handleTaskUpdate(payload.new.id, payload.new as Task)
          } else if (payload.eventType === "DELETE") {
            handleTaskDelete(payload.old.id)
          }
        },
      )
      .subscribe()

    const subtasksChannel = supabase
      .channel("public:subtasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks" },
        async (payload: any) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
            await initialize(supabase)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(subtasksChannel)
    }
  }, [user, handleTaskUpdate, handleTaskDelete])

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
    handleTaskDelete(taskId)

    try {
      toast({
        title: "وظیفه حذف شد",
        description: "وظیفه با موفقیت حذف شد.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      handleTaskUpdate(taskId, originalTasks.find(t => t.id === taskId) as Partial<Task>) // Revert on error
      toast({
        title: "خطا در حذف وظیفه",
        description: "مشکلی در حذف وظیفه رخ داد.",
        variant: "destructive",
      })
    }
  }, [user, tasks, handleTaskDelete, handleTaskUpdate, toast])

  const completeTask = useCallback(async (taskId: string, completed: boolean) => {
    // Optimistic update
    const originalTasks = tasks
    handleTaskUpdate(taskId, { 
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
      handleTaskUpdate(taskId, originalTasks.find(t => t.id === taskId) as Partial<Task>) // Revert on error
      toast({
        title: "خطا در تغییر وضعیت وظیفه",
        description: "مشکلی در تغییر وضعیت وظیفه رخ داد.",
        variant: "destructive",
      })
    }
  }, [user, tasks, handleTaskUpdate, toast])

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
