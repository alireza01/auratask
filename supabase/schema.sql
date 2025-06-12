-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- TABLE: users
-- Description: Stores basic user profile information, linking to Supabase auth.
--
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    avatar_url text,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS Policy for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

--
-- TABLE: user_settings
-- Description: Stores user-specific settings, including gamification and API keys.
--
CREATE TABLE public.user_settings (
    id uuid NOT NULL PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    username text UNIQUE, -- For the leaderboard, can be null initially
    gemini_api_key text,
    aura_points integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    ai_speed_weight real NOT NULL DEFAULT 0.5, -- Weight for AI task ranking (0.0 to 1.0)
    ai_importance_weight real NOT NULL DEFAULT 0.5, -- Weight for AI task ranking (0.0 to 1.0)
    dark_mode boolean NOT NULL DEFAULT false,
    theme text NOT NULL DEFAULT 'default',
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS Policy for user_settings table
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL USING (auth.uid() = id);
CREATE POLICY "Allow authenticated users to view leaderboard data" ON public.user_settings FOR SELECT USING (auth.role() = 'authenticated');

--
-- TABLE: admin_api_keys
-- Description: Stores a pool of admin-provided API keys as a fallback system.
--
CREATE TABLE public.admin_api_keys (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key text NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    usage_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS Policy for admin_api_keys table
ALTER TABLE public.admin_api_keys ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE id = auth.uid() AND username = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only admins can manage API keys
CREATE POLICY "Admins can manage API keys" ON public.admin_api_keys FOR ALL
    USING (public.is_admin());

-- Authenticated users (server) can read active keys
CREATE POLICY "Server can read active API keys" ON public.admin_api_keys FOR SELECT
    USING (is_active = true);

--
-- TABLE: groups
-- Description: Stores user-created task groups (or categories).
--
CREATE TABLE public.groups (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id text, -- Used for anonymous users before sign-up
    name text NOT NULL,
    emoji text DEFAULT '📁', -- AI-suggested emoji for the group
    color text DEFAULT '#BCA9F0', -- User-selected hex color for the group
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT groups_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_id IS NULL) OR 
        (user_id IS NULL AND guest_id IS NOT NULL)
    )
);

-- RLS Policy for groups table
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own groups" ON public.groups FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Guests can manage their groups" ON public.groups FOR ALL USING (
    user_id IS NULL AND guest_id IS NOT NULL
);

--
-- TABLE: tags
-- Description: Stores user-created tags for organizing tasks.
--
CREATE TABLE public.tags (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id text, -- Used for anonymous users
    name text NOT NULL,
    color text DEFAULT '#6366f1',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tags_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_id IS NULL) OR 
        (user_id IS NULL AND guest_id IS NOT NULL)
    )
);

-- RLS Policy for tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tags" ON public.tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Guests can manage their tags" ON public.tags FOR ALL USING (
    user_id IS NULL AND guest_id IS NOT NULL
);

--
-- TABLE: tasks
-- Description: The main table for tasks.
--
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id text, -- Used for anonymous users
    group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    is_completed boolean NOT NULL DEFAULT false,
    is_archived boolean NOT NULL DEFAULT false,
    due_date date,
    ai_speed_score integer CHECK (ai_speed_score >= 1 AND ai_speed_score <= 20),
    ai_importance_score integer CHECK (ai_importance_score >= 1 AND ai_importance_score <= 20),
    speed_tag text,
    importance_tag text,
    emoji text DEFAULT '📝',
    ai_generated boolean NOT NULL DEFAULT false, -- Was this task's data AI-enhanced?
    disable_ai boolean NOT NULL DEFAULT false, -- User choice to exclude from AI processing
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tasks_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_id IS NULL) OR 
        (user_id IS NULL AND guest_id IS NOT NULL)
    )
);

-- RLS Policy for tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Guests can manage their tasks" ON public.tasks FOR ALL USING (
    user_id IS NULL AND guest_id IS NOT NULL
);

--
-- TABLE: sub_tasks
-- Description: Stores sub-tasks, related to a parent task.
--
CREATE TABLE public.sub_tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id text, -- Used for anonymous users
    title text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    ai_generated boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sub_tasks_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_id IS NULL) OR 
        (user_id IS NULL AND guest_id IS NOT NULL)
    )
);

-- RLS Policy for sub_tasks table
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sub_tasks" ON public.sub_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Guests can manage their sub_tasks" ON public.sub_tasks FOR ALL USING (
    user_id IS NULL AND guest_id IS NOT NULL
);

--
-- TABLE: task_tags
-- Description: Junction table for task-tag relationships.
--
CREATE TABLE public.task_tags (
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- RLS Policy for task_tags table
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their task tags" ON public.task_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
);
CREATE POLICY "Guests can manage their task tags" ON public.task_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_tags.task_id AND tasks.guest_id IS NOT NULL)
);

--
-- FUNCTION: create_user_profile_and_settings()
-- Description: Triggered on new user creation in auth.users.
-- Creates corresponding entries in public.users and public.user_settings.
--
CREATE OR REPLACE FUNCTION public.create_user_profile_and_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a profile
    INSERT INTO public.users (id, email, avatar_url, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'full_name');
    
    -- Create settings
    INSERT INTO public.user_settings (id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for the function
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_and_settings();
    
--
-- FUNCTION: migrate_guest_data_to_user()
-- Description: An RPC function to be called by the application after a user signs up.
-- It takes a guest_id and atomically updates all guest data to the new user_id.
--
CREATE OR REPLACE FUNCTION public.migrate_guest_data_to_user(guest_id_to_migrate text)
RETURNS void AS $$
DECLARE
  new_user_id uuid := auth.uid();
BEGIN
  -- Ensure the caller is authenticated
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to migrate data.';
  END IF;

  -- Update groups
  UPDATE public.groups
  SET user_id = new_user_id, guest_id = NULL
  WHERE guest_id = guest_id_to_migrate;

  -- Update tasks
  UPDATE public.tasks
  SET user_id = new_user_id, guest_id = NULL
  WHERE guest_id = guest_id_to_migrate;
  
  -- Update sub_tasks
  UPDATE public.sub_tasks
  SET user_id = new_user_id, guest_id = NULL
  WHERE guest_id = guest_id_to_migrate;

  -- Update tags
  UPDATE public.tags
  SET user_id = new_user_id, guest_id = NULL
  WHERE guest_id = guest_id_to_migrate;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_guest_id ON public.tasks(guest_id);
CREATE INDEX idx_tasks_completed ON public.tasks(is_completed);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_groups_user_id ON public.groups(user_id);
CREATE INDEX idx_groups_guest_id ON public.groups(guest_id);
CREATE INDEX idx_sub_tasks_task_id ON public.sub_tasks(task_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_tags_guest_id ON public.tags(guest_id);
CREATE INDEX idx_user_settings_aura_points ON public.user_settings(aura_points DESC);
CREATE INDEX idx_user_settings_username ON public.user_settings(username);
