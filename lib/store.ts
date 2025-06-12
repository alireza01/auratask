import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { User, Task, TaskGroup, Tag, UserSettings, TaskFilters, Subtask } from "@/types"
import { supabase } from "./supabase-client"
import { toast } from "sonner"
import { showAuraAwardToast } from "./toast-notifications" // Added import

interface AuraReward {
  points: number
  reason: string
  timestamp: number
}

interface AppState {
  // Data State
  user: User | null
  guestId: string | null
  tasks: Task[]
  groups: TaskGroup[]
  tags: Tag[]
  settings: UserSettings | null
  isLoading: boolean
  error: string | null

  // UI State
  activeTab: "all" | "today" | "important" | "completed"
  filters: TaskFilters
  showFilters: boolean
  isSettingsPanelOpen: boolean
  isTaskFormOpen: boolean
  isGroupFormOpen: boolean
  isTagFormOpen: boolean
  isUsernameModalOpen: boolean
  editingTask: Task | null
  editingGroup: TaskGroup | null
  editingTag: Tag | null
  darkMode: boolean

  // Gamification State
  justLeveledUpTo: number | null // New state for level up toast
  newlyUnlockedAchievement: Achievement | null // New state for achievement toast

  // Actions
  setUser: (user: User | null) => void
  setGuestId: (guestId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDarkMode: (darkMode: boolean) => void

  // Data Actions
  fetchInitialData: () => Promise<void>
  refreshTasks: () => Promise<void>
  migrateGuestData: () => Promise<void>

  // Task Actions
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  toggleTaskComplete: (taskId: string, tAuraAward: string, tDismiss: string) => Promise<void>
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>
  moveTaskToGroup: (taskId: string, newGroupId: string | null) => Promise<void>
  addSubtask: (taskId: string, subtaskTitle: string) => Promise<void>
  updateSubtask: (subtaskId: string, updates: Partial<Subtask>) => Promise<void>
  deleteSubtask: (subtaskId: string) => Promise<void>
  toggleSubtaskComplete: (subtaskId: string, tAuraAward: string, tDismiss: string) => Promise<void>

  // Group Actions
  addGroup: (group: Omit<TaskGroup, "id" | "created_at" | "updated_at">) => Promise<void>
  updateGroup: (groupId: string, updates: Partial<TaskGroup>) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
  reorderGroups: (reorderedGroups: TaskGroup[]) => Promise<void>

  // Tag Actions
  addTag: (tag: Omit<Tag, "id" | "created_at">) => Promise<void>
  updateTag: (tagId: string, updates: Partial<Tag>) => Promise<void>
  deleteTag: (tagId: string) => Promise<void>
  addTagToTask: (taskId: string, tagId: string) => Promise<void>
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>

  // UI Actions
  setActiveTab: (tab: AppState["activeTab"]) => void
  setFilter: (filter: Partial<TaskFilters>) => void
  clearFilters: () => void
  toggleFilters: () => void
  toggleSettingsPanel: (isOpen?: boolean) => void
  openTaskForm: (task?: Task) => void
  closeTaskForm: () => void
  openGroupForm: (group?: TaskGroup) => void
  closeGroupForm: () => void
  openTagForm: (tag?: Tag) => void
  closeTagForm: () => void
  openUsernameModal: () => void
  closeUsernameModal: () => void

  // Settings Actions
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  updateUsername: (username: string) => Promise<void>

  // Gamification Actions
  awardAura: (points: number, reason: string, tAuraAward: string, tDismiss: string) => Promise<void>
  // clearAuraReward: () => void // To be removed later - REMOVING NOW
  setJustLeveledUpTo: (level: number | null) => void // New action
  setNewlyUnlockedAchievement: (achievement: Achievement | null) => void // New action
}

// Import Achievement type for the new state
import type { Achievement } from "./toast-notifications"

const initialFilters: TaskFilters = {
  searchQuery: "",
  filterGroup: null,
  filterStatus: "all",
  filterPriority: "all",
  filterTag: null,
}

// Generate a unique guest ID
const generateGuestId = () => `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        guestId: null,
        tasks: [],
        groups: [],
        tags: [],
        settings: null,
        isLoading: true,
        error: null,
        activeTab: "all",
        filters: initialFilters,
        showFilters: false,
        isSettingsPanelOpen: false,
        isTaskFormOpen: false,
        isGroupFormOpen: false,
        isTagFormOpen: false,
        isUsernameModalOpen: false,
        editingTask: null,
        editingGroup: null,
        editingTag: null,
        darkMode: false,
        justLeveledUpTo: null, // Initialize new state
        newlyUnlockedAchievement: null, // Initialize new state

        // Basic Setters
        setUser: (user) => set({ user }),
        setGuestId: (guestId) => set({ guestId }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setDarkMode: (darkMode) => {
          set({ darkMode })
          if (darkMode) {
            document.documentElement.classList.add("dark")
          } else {
            document.documentElement.classList.remove("dark")
          }
        },

        // Data Fetching
        fetchInitialData: async () => {
          const { user, guestId } = get()

          set({ isLoading: true, error: null })

          try {
            const userId = user?.id
            let currentGuestId = guestId

            // If no user and no guest ID, create one
            if (!userId && !currentGuestId) {
              currentGuestId = generateGuestId()
              set({ guestId: currentGuestId })
            }

            // Build query conditions
            const queryConditions = userId ? { user_id: userId } : { guest_id: currentGuestId }

            const [tasksRes, groupsRes, tagsRes, settingsRes] = await Promise.all([
              supabase
                .from("tasks")
                .select(`
                  *,
                  subtasks:sub_tasks(*),
                  group:groups(*)
                `)
                .match(queryConditions)
                .order("order_index", { ascending: true, nullsFirst: false }), // Updated order
              supabase.from("groups").select("*").match(queryConditions).order("created_at"),
              supabase.from("tags").select("*").match(queryConditions),
              userId
                ? supabase.from("user_settings").select("*").eq("id", userId).single()
                : Promise.resolve({ data: null, error: null }),
            ])

            if (tasksRes.error && tasksRes.error.code !== "PGRST116") throw tasksRes.error
            if (groupsRes.error && groupsRes.error.code !== "PGRST116") throw groupsRes.error
            if (tagsRes.error && tagsRes.error.code !== "PGRST116") throw tagsRes.error
            if (settingsRes.error && settingsRes.error.code !== "PGRST116" && userId) throw settingsRes.error

            // Fetch task tags if we have tasks
            const taskIds = tasksRes.data?.map((task) => task.id) || []
            const taskTags: Record<string, Tag[]> = {}

            if (taskIds.length > 0) {
              const { data: taskTagsData, error: taskTagsError } = await supabase
                .from("task_tags")
                .select(`
                  task_id,
                  tag:tags(*)
                `)
                .in("task_id", taskIds)

              if (taskTagsError && taskTagsError.code !== "PGRST116") throw taskTagsError

              // Group tags by task_id
              taskTagsData?.forEach((item) => {
                if (!taskTags[item.task_id]) {
                  taskTags[item.task_id] = []
                }
                taskTags[item.task_id].push(item.tag)
              })
            }

            // Add tags to tasks
            const tasksWithTags =
              tasksRes.data?.map((task) => ({
                ...task,
                tags: taskTags[task.id] || [],
              })) || []

            set({
              tasks: tasksWithTags,
              groups: groupsRes.data || [],
              tags: tagsRes.data || [],
              settings: settingsRes.data,
              isLoading: false,
              error: null,
            })

            // Set dark mode based on settings
            if (settingsRes.data?.dark_mode) {
              get().setDarkMode(true)
            }

            // Check if user needs to set username
            if (userId && settingsRes.data && !settingsRes.data.username) {
              set({ isUsernameModalOpen: true })
            }
          } catch (error) {
            console.error("Error fetching initial data:", error)
            set({
              error: "خطا در بارگذاری اطلاعات",
              isLoading: false,
            })
            toast.error("خطا در بارگذاری اطلاعات")
          }
        },

        refreshTasks: async () => {
          const { user, guestId } = get()

          try {
            const queryConditions = user?.id ? { user_id: user.id } : { guest_id: guestId }

            const { data, error } = await supabase
              .from("tasks")
              .select(`
                *,
                subtasks:sub_tasks(*),
                group:groups(*)
              `)
              .match(queryConditions)
              .order("order_index", { ascending: true, nullsFirst: false }) // Updated order

            if (error) throw error

            // Fetch task tags
            const taskIds = data?.map((task) => task.id) || []
            const taskTags: Record<string, Tag[]> = {}

            if (taskIds.length > 0) {
              const { data: taskTagsData, error: taskTagsError } = await supabase
                .from("task_tags")
                .select(`
                  task_id,
                  tag:tags(*)
                `)
                .in("task_id", taskIds)

              if (taskTagsError) throw taskTagsError

              // Group tags by task_id
              taskTagsData?.forEach((item) => {
                if (!taskTags[item.task_id]) {
                  taskTags[item.task_id] = []
                }
                taskTags[item.task_id].push(item.tag)
              })
            }

            // Add tags to tasks
            const tasksWithTags =
              data?.map((task) => ({
                ...task,
                tags: taskTags[task.id] || [],
              })) || []

            set({ tasks: tasksWithTags })
          } catch (error) {
            console.error("Error refreshing tasks:", error)
            toast.error("خطا در به‌روزرسانی وظایف")
          }
        },

        migrateGuestData: async (newUserId: string) => {
          const { guestId } = get()
          if (!guestId) {
            console.log("No guestId found, skipping migration.")
            return
          }
          if (!newUserId) {
            console.error("New user ID not provided for migration.")
            toast.error("خطا: شناسه کاربر جدید برای انتقال اطلاعات یافت نشد.")
            return
          }

          set({ isLoading: true })
          try {
            const response = await fetch("/api/migrate-guest-data", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                guest_user_id: guestId,
                new_user_id: newUserId,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "Failed to migrate data from API")
            }

            // Clear guest ID and refresh data for the new user
            set({ guestId: null, isLoading: false })
            await get().fetchInitialData() // This will now fetch data for the logged-in user

            toast.success("اطلاعات با موفقیت منتقل شد")
          } catch (error: any) {
            console.error("Error migrating guest data:", error)
            toast.error(`خطا در انتقال اطلاعات: ${error.message}`)
            set({ isLoading: false })
          }
        },

        // Task Actions
        addTask: async (taskData) => {
          const { user, guestId, tasks: currentTasks } = get() // Added tasks to get current list

          try {
            // Calculate new order_index
            const maxOrderIndex = currentTasks.reduce((max, t) => Math.max(max, t.order_index || 0), 0)
            const newOrderIndex = maxOrderIndex + 10000

            const insertData = user?.id
              ? { ...taskData, user_id: user.id, order_index: newOrderIndex }
              : { ...taskData, guest_id: guestId, order_index: newOrderIndex }

            const { data, error } = await supabase
              .from("tasks")
              .insert([insertData])
              .select(`
                *,
                subtasks:sub_tasks(*),
                group:groups(*)
              `)
              .single()

            if (error) throw error

            set((state) => ({
              // Ensure tasks are sorted by order_index after adding
              tasks: [...state.tasks, { ...data, tags: [] }].sort((a,b) => (a.order_index || 0) - (b.order_index || 0)),
            }))

            toast.success("وظیفه با موفقیت اضافه شد")
          } catch (error) {
            console.error("Error adding task:", error)
            toast.error("خطا در اضافه کردن وظیفه")
          }
        },

        updateTask: async (taskId, updates) => {
          try {
            // Optimistic update
            set((state) => ({
              tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
            }))

            const { error } = await supabase.from("tasks").update(updates).eq("id", taskId)

            if (error) {
              throw error
            }

            toast.success("وظیفه با موفقیت به‌روزرسانی شد")
          } catch (error) {
            console.error("Error updating task:", error)
            toast.error("خطا در به‌روزرسانی وظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        deleteTask: async (taskId) => {
          try {
            // Optimistic update
            set((state) => ({
              tasks: state.tasks.filter((task) => task.id !== taskId),
            }))

            const { error } = await supabase.from("tasks").delete().eq("id", taskId)

            if (error) throw error

            toast.success("وظیفه با موفقیت حذف شد")
          } catch (error) {
            console.error("Error deleting task:", error)
            toast.error("خطا در حذف وظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        toggleTaskComplete: async (taskId, tAuraAward, tDismiss) => {
          const { tasks, awardAura, settings: currentSettings } = get() // Renamed to avoid conflict if 'settings' is used later
          const task = tasks.find((t) => t.id === taskId)
          if (!task) return

          const updates = {
            is_completed: !task.is_completed,
          }

          // Optimistic update
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
          }))

          try {
            const { error } = await supabase.from("tasks").update(updates).eq("id", taskId)

            if (error) throw error

            // Award aura points for completing task
            if (updates.is_completed) {
              const basePoints = 10
              // const settings = get().settings; // Accessing settings as planned
              const importanceBonus = currentSettings ? Math.floor((task.ai_importance_score || 0) * currentSettings.ai_importance_weight) : 0;
              const speedBonus = currentSettings ? Math.floor((task.ai_speed_score || 0) * currentSettings.ai_speed_weight) : 0;
              const totalPoints = basePoints + importanceBonus + speedBonus

              await awardAura(totalPoints, "تکمیل وظیفه", tAuraAward, tDismiss)
            }

            toast.success(updates.is_completed ? "وظیفه تکمیل شد" : "وظیفه به حالت ناتمام برگشت")
          } catch (error) {
            console.error("Error toggling task completion:", error)
            toast.error("خطا در تغییر وضعیت وظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        reorderTasks: async (reorderedTasksFromUI: Task[]) => {
          // Assign new order_index values with a large step
          const updates = reorderedTasksFromUI.map((task, index) => ({
            id: task.id,
            order_index: (index + 1) * 10000, // Simple re-spacing
          }));

          // Create the new local state with these spaced indices
          const newTasksState = reorderedTasksFromUI.map((task, index) => ({
            ...task,
            order_index: (index + 1) * 10000,
          }));

          // Optimistic update: set the state with the new order, already sorted by UI.
          // The .sort() in fetch/refresh will handle DB consistency if this fails.
          set({ tasks: newTasksState });

          try {
            const { error } = await supabase.from("tasks").upsert(updates);
            if (error) throw error;
            // Optional: toast.success("ترتیب وظایف ذخیره شد");
          } catch (error) {
            console.error("Error reordering tasks:", error);
            toast.error("خطا در ذخیره ترتیب وظایف");
            get().refreshTasks(); // Revert
          }
        },

        moveTaskToGroup: async (taskId, newGroupId) => {
          // Optimistic update
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    group_id: newGroupId,
                    group: newGroupId ? state.groups.find((g) => g.id === newGroupId) : null,
                  }
                : task,
            ),
          }))

          try {
            const { error } = await supabase.from("tasks").update({ group_id: newGroupId }).eq("id", taskId)

            if (error) throw error

            toast.success(newGroupId ? "وظیفه به گروه منتقل شد" : "وظیفه از گروه خارج شد")
          } catch (error) {
            console.error("Error moving task to group:", error)
            toast.error("خطا در انتقال وظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        addSubtask: async (taskId, subtaskTitle) => {
          const { user, guestId } = get()

          try {
            const insertData = user?.id
              ? { task_id: taskId, user_id: user.id, title: subtaskTitle, is_completed: false }
              : { task_id: taskId, guest_id: guestId, title: subtaskTitle, is_completed: false }

            const { data, error } = await supabase.from("sub_tasks").insert(insertData).select().single()

            if (error) throw error

            // Update local state
            set((state) => ({
              tasks: state.tasks.map((task) => {
                if (task.id === taskId) {
                  return {
                    ...task,
                    subtasks: [...(task.subtasks || []), data],
                  }
                }
                return task
              }),
            }))

            toast.success("زیروظیفه اضافه شد")
          } catch (error) {
            console.error("Error adding subtask:", error)
            toast.error("خطا در اضافه کردن زیروظیفه")
          }
        },

        updateSubtask: async (subtaskId, updates) => {
          try {
            // Optimistic update
            set((state) => ({
              tasks: state.tasks.map((task) => {
                if (task.subtasks?.some((st) => st.id === subtaskId)) {
                  return {
                    ...task,
                    subtasks: task.subtasks.map((st) => (st.id === subtaskId ? { ...st, ...updates } : st)),
                  }
                }
                return task
              }),
            }))

            const { error } = await supabase.from("sub_tasks").update(updates).eq("id", subtaskId)

            if (error) throw error
          } catch (error) {
            console.error("Error updating subtask:", error)
            toast.error("خطا در به‌روزرسانی زیروظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        deleteSubtask: async (subtaskId) => {
          try {
            // Optimistic update
            set((state) => ({
              tasks: state.tasks.map((task) => {
                if (task.subtasks?.some((st) => st.id === subtaskId)) {
                  return {
                    ...task,
                    subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
                  }
                }
                return task
              }),
            }))

            const { error } = await supabase.from("sub_tasks").delete().eq("id", subtaskId)

            if (error) throw error

            toast.success("زیروظیفه حذف شد")
          } catch (error) {
            console.error("Error deleting subtask:", error)
            toast.error("خطا در حذف زیروظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        toggleSubtaskComplete: async (subtaskId, tAuraAward, tDismiss) => {
          // Find the subtask
          let subtask = null
          let parentTask = null

          for (const task of get().tasks) {
            const foundSubtask = task.subtasks?.find((st) => st.id === subtaskId)
            if (foundSubtask) {
              subtask = foundSubtask
              parentTask = task
              break
            }
          }

          if (!subtask || !parentTask) return

          const updates = {
            is_completed: !subtask.is_completed,
          }

          // Optimistic update
          set((state) => ({
            tasks: state.tasks.map((task) => {
              if (task.id === parentTask?.id) {
                return {
                  ...task,
                  subtasks: task.subtasks?.map((st) => (st.id === subtaskId ? { ...st, ...updates } : st)),
                }
              }
              return task
            }),
          }))

          try {
            const { error } = await supabase.from("sub_tasks").update(updates).eq("id", subtaskId)

            if (error) throw error

            // Award aura points for completing subtask
            if (updates.is_completed) {
              await get().awardAura(5, "تکمیل زیروظیفه", tAuraAward, tDismiss)
            }
          } catch (error) {
            console.error("Error toggling subtask completion:", error)
            toast.error("خطا در تغییر وضعیت زیروظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        // Group Actions
        addGroup: async (groupData) => {
          const { user, guestId } = get()

          try {
            const insertData = user?.id ? { ...groupData, user_id: user.id } : { ...groupData, guest_id: guestId }

            const { data, error } = await supabase.from("groups").insert([insertData]).select().single()

            if (error) throw error

            set((state) => ({
              groups: [...state.groups, data],
            }))

            toast.success("گروه با موفقیت اضافه شد")
          } catch (error) {
            console.error("Error adding group:", error)
            toast.error("خطا در اضافه کردن گروه")
          }
        },

        updateGroup: async (groupId, updates) => {
          try {
            // Optimistic update
            set((state) => ({
              groups: state.groups.map((group) => (group.id === groupId ? { ...group, ...updates } : group)),
              // Also update the group reference in tasks
              tasks: state.tasks.map((task) => {
                if (task.group_id === groupId) {
                  return {
                    ...task,
                    group: { ...(task.group || {}), ...updates },
                  }
                }
                return task
              }),
            }))

            const { error } = await supabase.from("groups").update(updates).eq("id", groupId)

            if (error) throw error

            toast.success("گروه با موفقیت به‌روزرسانی شد")
          } catch (error) {
            console.error("Error updating group:", error)
            toast.error("خطا در به‌روزرسانی گروه")
            // Revert optimistic update
            get().fetchInitialData()
          }
        },

        deleteGroup: async (groupId) => {
          try {
            // Optimistic update
            set((state) => ({
              groups: state.groups.filter((group) => group.id !== groupId),
              // Update tasks that were in this group
              tasks: state.tasks.map((task) => {
                if (task.group_id === groupId) {
                  return {
                    ...task,
                    group_id: null,
                    group: null,
                  }
                }
                return task
              }),
            }))

            const { error } = await supabase.from("groups").delete().eq("id", groupId)

            if (error) throw error

            toast.success("گروه با موفقیت حذف شد")
          } catch (error) {
            console.error("Error deleting group:", error)
            toast.error("خطا در حذف گروه")
            // Revert optimistic update
            get().fetchInitialData()
          }
        },

        reorderGroups: async (reorderedGroups) => {
          // Optimistic update
          set({ groups: reorderedGroups })

          try {
            const updates = reorderedGroups.map((group, index) => ({
              id: group.id,
              order_index: index,
            }))

            const { error } = await supabase.from("groups").upsert(updates)

            if (error) throw error
          } catch (error) {
            console.error("Error reordering groups:", error)
            toast.error("خطا در ذخیره ترتیب گروه‌ها")
            // Revert optimistic update
            get().fetchInitialData()
          }
        },

        // Tag Actions
        addTag: async (tagData) => {
          const { user, guestId } = get()

          try {
            const insertData = user?.id ? { ...tagData, user_id: user.id } : { ...tagData, guest_id: guestId }

            const { data, error } = await supabase.from("tags").insert([insertData]).select().single()

            if (error) throw error

            set((state) => ({
              tags: [...state.tags, data],
            }))

            toast.success("برچسب با موفقیت اضافه شد")
          } catch (error) {
            console.error("Error adding tag:", error)
            toast.error("خطا در اضافه کردن برچسب")
          }
        },

        updateTag: async (tagId, updates) => {
          try {
            // Optimistic update
            set((state) => ({
              tags: state.tags.map((tag) => (tag.id === tagId ? { ...tag, ...updates } : tag)),
              // Also update tag references in tasks
              tasks: state.tasks.map((task) => {
                if (task.tags?.some((t) => t.id === tagId)) {
                  return {
                    ...task,
                    tags: task.tags.map((t) => (t.id === tagId ? { ...t, ...updates } : t)),
                  }
                }
                return task
              }),
            }))

            const { error } = await supabase.from("tags").update(updates).eq("id", tagId)

            if (error) throw error

            toast.success("برچسب با موفقیت به‌روزرسانی شد")
          } catch (error) {
            console.error("Error updating tag:", error)
            toast.error("خطا در به‌روزرسانی برچسب")
            // Revert optimistic update
            get().fetchInitialData()
          }
        },

        deleteTag: async (tagId) => {
          try {
            // Optimistic update
            set((state) => ({
              tags: state.tags.filter((tag) => tag.id !== tagId),
              // Remove tag from tasks
              tasks: state.tasks.map((task) => {
                if (task.tags?.some((t) => t.id === tagId)) {
                  return {
                    ...task,
                    tags: task.tags.filter((t) => t.id !== tagId),
                  }
                }
                return task
              }),
            }))

            const { error } = await supabase.from("tags").delete().eq("id", tagId)

            if (error) throw error

            toast.success("برچسب با موفقیت حذف شد")
          } catch (error) {
            console.error("Error deleting tag:", error)
            toast.error("خطا در حذف برچسب")
            // Revert optimistic update
            get().fetchInitialData()
          }
        },

        addTagToTask: async (taskId, tagId) => {
          const { tasks, tags } = get()
          const task = tasks.find((t) => t.id === taskId)
          const tag = tags.find((t) => t.id === tagId)

          if (!task || !tag) return

          // Check if tag is already added
          if (task.tags?.some((t) => t.id === tagId)) {
            return
          }

          // Optimistic update
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id === taskId) {
                return {
                  ...t,
                  tags: [...(t.tags || []), tag],
                }
              }
              return t
            }),
          }))

          try {
            const { error } = await supabase.from("task_tags").insert({ task_id: taskId, tag_id: tagId })

            if (error) throw error

            toast.success("برچسب به وظیفه اضافه شد")
          } catch (error) {
            console.error("Error adding tag to task:", error)
            toast.error("خطا در اضافه کردن برچسب به وظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        removeTagFromTask: async (taskId, tagId) => {
          // Optimistic update
          set((state) => ({
            tasks: state.tasks.map((task) => {
              if (task.id === taskId) {
                return {
                  ...task,
                  tags: task.tags?.filter((t) => t.id !== tagId) || [],
                }
              }
              return task
            }),
          }))

          try {
            const { error } = await supabase.from("task_tags").delete().eq("task_id", taskId).eq("tag_id", tagId)

            if (error) throw error

            toast.success("برچسب از وظیفه حذف شد")
          } catch (error) {
            console.error("Error removing tag from task:", error)
            toast.error("خطا در حذف برچسب از وظیفه")
            // Revert optimistic update
            get().refreshTasks()
          }
        },

        // UI Actions
        setActiveTab: (activeTab) => set({ activeTab }),

        setFilter: (filterUpdate) => {
          set((state) => ({
            filters: { ...state.filters, ...filterUpdate },
          }))
        },

        clearFilters: () => set({ filters: initialFilters }),

        toggleFilters: () =>
          set((state) => ({
            showFilters: !state.showFilters,
          })),

        toggleSettingsPanel: (isOpen) =>
          set((state) => ({
            isSettingsPanelOpen: typeof isOpen === "boolean" ? isOpen : !state.isSettingsPanelOpen,
          })),

        openTaskForm: (task) =>
          set({
            isTaskFormOpen: true,
            editingTask: task || null,
          }),

        closeTaskForm: () =>
          set({
            isTaskFormOpen: false,
            editingTask: null,
          }),

        openGroupForm: (group) =>
          set({
            isGroupFormOpen: true,
            editingGroup: group || null,
          }),

        closeGroupForm: () =>
          set({
            isGroupFormOpen: false,
            editingGroup: null,
          }),

        openTagForm: (tag) =>
          set({
            isTagFormOpen: true,
            editingTag: tag || null,
          }),

        closeTagForm: () =>
          set({
            isTagFormOpen: false,
            editingTag: null,
          }),

        openUsernameModal: () => set({ isUsernameModalOpen: true }),
        closeUsernameModal: () => set({ isUsernameModalOpen: false }),

        // Settings Actions
        updateSettings: async (updates) => {
          const { user, settings } = get()
          if (!user) return

          try {
            // Handle dark mode separately
            if (updates.dark_mode !== undefined) {
              get().setDarkMode(updates.dark_mode)
            }

            const { data, error } = await supabase
              .from("user_settings")
              .upsert({
                id: user.id,
                ...(settings || {}),
                ...updates,
              })
              .select()
              .single()

            if (error) throw error

            set({ settings: data })
            toast.success("تنظیمات با موفقیت به‌روزرسانی شد")
          } catch (error) {
            console.error("Error updating settings:", error)
            toast.error("خطا در به‌روزرسانی تنظیمات")
          }
        },

        updateUsername: async (username) => {
          const { user } = get()
          if (!user) return

          try {
            const { data, error } = await supabase
              .from("user_settings")
              .update({ username })
              .eq("id", user.id)
              .select()
              .single()

            if (error) throw error

            set({ settings: data, isUsernameModalOpen: false })
            toast.success("نام کاربری با موفقیت تنظیم شد")
          } catch (error) {
            console.error("Error updating username:", error)
            toast.error("خطا در تنظیم نام کاربری")
          }
        },

        // Gamification Actions
        awardAura: async (points, reason, tAuraAward, tDismiss) => {
          const { user, settings, setJustLeveledUpTo } = get() // Add setJustLeveledUpTo
          if (!user || !settings) return

          try {
            const originalLevel = settings.level || 1
            const newAuraPoints = (settings.aura_points || 0) + points
            // Level calculation logic might be more complex if using a formula like in check_level_up
            // For now, let's assume a simple 100 points per level for client-side prediction
            // Or, better, let check_level_up handle the authoritative level update.
            // However, awardAura currently updates level directly.
            // We need to ensure this aligns with how check_level_up would calculate it, or rely on check_level_up.
            // For this subtask, we'll react to the level change made by awardAura itself.
            const newPredictedLevel = Math.floor(newAuraPoints / (settings.level_up_xp_threshold || 100)) + (settings.level_up_xp_threshold ? 0 : 1) // Simplified: this needs to be robust
                                      // A better approach: awardAura updates points, then call an RPC to check level and get new level state.
                                      // For now, use the level already calculated by awardAura.

            const newLevelFromAwardAura = Math.floor(newAuraPoints / 100) + 1 // This is the current simple logic in awardAura

            const { error } = await supabase
              .from("user_settings")
              .update({
                aura_points: newAuraPoints,
                level: newLevelFromAwardAura, // Using the level calculated by awardAura
              })
              .eq("id", user.id)

            if (error) throw error

            // Update local state
            set((state) => ({
              settings: state.settings
                ? {
                    ...state.settings,
                    aura_points: newAuraPoints,
                    level: newLevelFromAwardAura,
                  }
                : null,
            }))

            if (newLevelFromAwardAura > originalLevel) {
              setJustLeveledUpTo(newLevelFromAwardAura)
            }

            showAuraAwardToast(points, reason, tAuraAward, tDismiss)
          } catch (error) {
            console.error("Error awarding aura:", error)
            // Potentially show an error toast here if awarding aura itself fails critically
            // toast.error("خطا در ثبت امتیاز آئورا");
          }
        },

        // clearAuraReward: () => set({ /* lastAuraReward: null */ }), // REMOVING NOW
        setJustLeveledUpTo: (level) => set({ justLeveledUpTo: level }),
        setNewlyUnlockedAchievement: (achievement) => set({ newlyUnlockedAchievement: achievement }),
      }),
      {
        name: "auratask-store",
        partialize: (state) => ({
          darkMode: state.darkMode,
          activeTab: state.activeTab,
          filters: state.filters,
          showFilters: state.showFilters,
          guestId: state.guestId,
        }),
      },
    ),
    {
      name: "auratask-debug",
    },
  ),
)
