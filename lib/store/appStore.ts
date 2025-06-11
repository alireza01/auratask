import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { Task, TaskGroup, UserSettings, User, Theme, Tag } from '../../types'; // Adjust path as needed
import { toast } from 'sonner';

// Define the types for your state
type Group = TaskGroup;
type Settings = UserSettings;

interface AppState {
  tasks: Task[];
  groups: Group[];
  tags: Tag[];
  settings: Settings;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: (supabase: SupabaseClient) => Promise<void>;
  updateTask: (supabase: SupabaseClient, taskId: string, updatedFields: Partial<Task>) => Promise<void>;
  
  // Placeholder actions
  addTask: (supabase: SupabaseClient, newTask: Partial<Task>) => Promise<void>;
  deleteTask: (supabase: SupabaseClient, taskId: string) => Promise<void>;
  addGroup: (supabase: SupabaseClient, newGroup: Partial<Group>) => Promise<void>;
  updateGroup: (supabase: SupabaseClient, groupId: string, updatedFields: Partial<Group>) => Promise<void>;
  deleteGroup: (supabase: SupabaseClient, groupId: string) => Promise<void>;
  updateSettings: (supabase: SupabaseClient, newSettings: Partial<Settings>) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  fetchTags: (supabase: SupabaseClient) => Promise<void>;
  addTag: (supabase: SupabaseClient, newTag: Partial<Tag>) => Promise<void>;
  updateTag: (supabase: SupabaseClient, tagId: string, updatedFields: Partial<Tag>) => Promise<void>;
  deleteTag: (supabase: SupabaseClient, tagId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  groups: [],
  tags: [],
  settings: {
    id: '', // Placeholder
    user_id: '', // Placeholder
    gemini_api_key: undefined,
    speed_weight: 0.5,
    importance_weight: 0.5,
    auto_ranking: false,
    auto_subtasks: false,
    auto_tagging: false,
    theme: 'default' as Theme, // Default theme
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  user: null,
  isLoading: false,
  error: null,

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  initialize: async (supabase: SupabaseClient) => {
    set({ isLoading: true, error: null });
    try {
      const [tasksResponse, groupsResponse, tagsResponse, settingsResponse, userResponse] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('groups').select('*'),
        supabase.from('tags').select('*'),
        supabase.from('user_settings').select('*').single(),
        supabase.auth.getUser()
      ]);

      if (tasksResponse.error) throw tasksResponse.error;
      if (groupsResponse.error) throw groupsResponse.error;
      if (tagsResponse.error) throw tagsResponse.error;
      if (settingsResponse.error && settingsResponse.error.code !== 'PGRST116') throw settingsResponse.error;
      if (userResponse.error) throw userResponse.error;

      const supabaseUser = userResponse.data.user;
      const mappedUser = supabaseUser ? {
        id: supabaseUser.id,
        aud: supabaseUser.aud,
        role: supabaseUser.role || 'user',
        email: supabaseUser.email || '',
        email_confirmed_at: supabaseUser.email_confirmed_at || new Date().toISOString(),
        phone: supabaseUser.phone || '',
        confirmed_at: supabaseUser.confirmed_at || new Date().toISOString(),
        last_sign_in_at: supabaseUser.last_sign_in_at || new Date().toISOString(),
        app_metadata: {
          provider: supabaseUser.app_metadata?.provider || 'email',
          providers: supabaseUser.app_metadata?.providers || ['email']
        },
        user_metadata: {
          avatar_url: supabaseUser.user_metadata?.avatar_url || '',
          email: supabaseUser.email || '',
          email_change_count: supabaseUser.user_metadata?.email_change_count || 0,
          full_name: supabaseUser.user_metadata?.full_name || '',
          iss: supabaseUser.user_metadata?.iss || '',
          name: supabaseUser.user_metadata?.name || '',
          picture: supabaseUser.user_metadata?.picture || '',
          provider_id: supabaseUser.user_metadata?.provider_id || '',
          sub: supabaseUser.user_metadata?.sub || ''
        },
        identities: supabaseUser.identities || [],
        created_at: supabaseUser.created_at || new Date().toISOString(),
        updated_at: supabaseUser.updated_at || new Date().toISOString()
      } : null;

      set({ 
        tasks: tasksResponse.data || [],
        groups: groupsResponse.data || [],
        tags: tagsResponse.data || [],
        settings: settingsResponse.data || get().settings,
        user: mappedUser,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to initialize app store:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize app',
        isLoading: false 
      });
      toast.error('Failed to load your data. Please refresh the page.');
    }
  },

  updateTask: async (supabase: SupabaseClient, taskId: string, updatedFields: Partial<Task>) => {
    const originalTasks = get().tasks;
    
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedFields } : task
      ),
    }));

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updatedFields)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Update state with the actual data from the server
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...data } : task
        ),
      }));

      return data; // Return the updated task data
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update on error
      set({ tasks: originalTasks });
      throw error;
    }
  },

  // Placeholder for addTask action
  addTask: async (supabase: SupabaseClient, newTask: Partial<Task>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        tasks: [...state.tasks, data],
        isLoading: false 
      }));
      toast.success('Task added successfully');
    } catch (error) {
      console.error('Failed to add task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add task',
        isLoading: false 
      });
      toast.error('Failed to add task. Please try again.');
      throw error;
    }
  },

  // Placeholder for deleteTask action
  deleteTask: async (supabase: SupabaseClient, taskId: string): Promise<void> => {
    const originalTasks = get().tasks;
    
    // Optimistic update
    set((state) => ({ 
      tasks: state.tasks.filter((task) => task.id !== taskId) 
    }));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Revert optimistic update on error
      set({ tasks: originalTasks });
      throw error;
    }
  },

  // Placeholder for addGroup action
  addGroup: async (supabase: SupabaseClient, newGroup: Partial<Group>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert(newGroup)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        groups: [...state.groups, data],
        isLoading: false 
      }));
      toast.success('Group added successfully');
    } catch (error) {
      console.error('Failed to add group:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add group',
        isLoading: false 
      });
      toast.error('Failed to add group. Please try again.');
      throw error;
    }
  },

  // Placeholder for updateGroup action
  updateGroup: async (supabase: SupabaseClient, groupId: string, updatedFields: Partial<Group>) => {
    const originalGroups = get().groups;
    
    // Optimistic update
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, ...updatedFields } : group
      ),
    }));

    try {
      const { error } = await supabase
        .from('groups')
        .update(updatedFields)
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group updated successfully');
    } catch (error) {
      console.error('Failed to update group:', error);
      // Revert optimistic update on error
      set({ groups: originalGroups });
      toast.error('Failed to update group. Please try again.');
      throw error;
    }
  },

  // Placeholder for deleteGroup action
  deleteGroup: async (supabase: SupabaseClient, groupId: string) => {
    const originalGroups = get().groups;
    
    // Optimistic update
    set((state) => ({ 
      groups: state.groups.filter((group) => group.id !== groupId) 
    }));

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Failed to delete group:', error);
      // Revert optimistic update on error
      set({ groups: originalGroups });
      toast.error('Failed to delete group. Please try again.');
      throw error;
    }
  },

  // Placeholder for updateSettings action
updateSettings: async (supabase, newSettings) => {
  const originalSettings = get().settings;
  // Optimistic update for instant UI feedback
  set((state) => ({ settings: { ...state.settings, ...newSettings } }));

  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ ...newSettings, user_id: get().user!.id }, { onConflict: 'user_id' });

    if (error) throw error;
    toast.success('Settings saved!');
  } catch (error) {
    // Revert on failure
    set({ settings: originalSettings });
    toast.error('Failed to save settings.');
  }
},
  // Actions for Tags
  fetchTags: async (supabase: SupabaseClient) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      set({ tags: data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
        isLoading: false,
      });
      toast.error('Failed to load tags. Please refresh the page.');
    }
  },

  addTag: async (supabase: SupabaseClient, newTag: Partial<Tag>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert(newTag)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tags: [...state.tags, data],
        isLoading: false,
      }));
      toast.success('Tag added successfully');
    } catch (error) {
      console.error('Failed to add tag:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add tag',
        isLoading: false,
      });
      toast.error('Failed to add tag. Please try again.');
      throw error;
    }
  },

  updateTag: async (supabase: SupabaseClient, tagId: string, updatedFields: Partial<Tag>) => {
    const originalTags = get().tags;

    // Optimistic update
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === tagId ? { ...tag, ...updatedFields } : tag
      ),
    }));

    try {
      const { error } = await supabase
        .from('tags')
        .update(updatedFields)
        .eq('id', tagId);

      if (error) throw error;

      toast.success('Tag updated successfully');
    } catch (error) {
      console.error('Failed to update tag:', error);
      // Revert optimistic update on error
      set({ tags: originalTags });
      toast.error('Failed to update tag. Please try again.');
      throw error;
    }
  },

  deleteTag: async (supabase: SupabaseClient, tagId: string) => {
    const originalTags = get().tags;

    // Optimistic update
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== tagId),
    }));

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      // Revert optimistic update on error
      set({ tags: originalTags });
      toast.error('Failed to delete tag. Please try again.');
      throw error;
    }
  },
}));