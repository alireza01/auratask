export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
  is_anonymous?: boolean;
}

export interface UserSettings {
  id: string
  username?: string
  gemini_api_key?: string
  aura_points: number
  level: number
  ai_speed_weight: number
  ai_importance_weight: number
  dark_mode?: boolean
  theme?: "default" | "alireza" | "neda"
  haptic_feedback_enabled: boolean;
  auto_ranking_enabled?: boolean;
  auto_subtask_enabled?: boolean;
  created_at: string
}

export interface TaskGroup {
  id: string
  user_id?: string
  guest_id?: string
  name: string
  emoji?: string
  color?: string
  created_at: string
}

export interface Tag {
  id: string
  user_id?: string
  guest_id?: string
  name: string
  color: string
  created_at: string
}

export interface Subtask {
  id: string
  task_id: string
  user_id?: string
  guest_id?: string
  title: string
  is_completed: boolean
  ai_generated: boolean
  created_at: string
}

export interface Task {
  id: string
  user_id?: string
  guest_id?: string
  group_id?: string | null
  title: string
  description?: string
  is_completed: boolean
  is_archived: boolean
  due_date?: string
  ai_speed_score?: number
  ai_importance_score?: number
  speed_tag?: string
  importance_tag?: string
  emoji?: string
  ai_generated: boolean
  enable_ai_ranking: boolean
  enable_ai_subtasks: boolean
  created_at: string
  subtasks?: Subtask[]
  tags?: Tag[]
  group?: TaskGroup
}

export interface TaskFilters {
  searchQuery: string
  filterGroup: string | null
  filterStatus: "all" | "completed" | "active"
  filterPriority: "all" | "high" | "medium" | "low"
  filterTag: string | null
}

export interface AITaskAnalysis {
  ai_speed_score: number | null
  ai_importance_score: number | null
  speed_tag: string | null
  importance_tag: string | null
  emoji: string | null
  sub_tasks?: string[]
  ai_generated: boolean
}

export interface TaskStats {
  total: number
  completed: number
  overdue: number
  dueToday: number
  completionRate: number
}

export interface AdminLog {
  id: string
  created_at: string
  level: "INFO" | "WARNING" | "ERROR" | "FATAL"
  message: string
  metadata?: any
  is_resolved: boolean
}
