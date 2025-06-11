import TaskDashboard from '@/components/task-dashboard'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { User } from '@/types'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  
  // Convert Supabase user to our User type
  const user: User | null = supabaseUser ? {
    id: supabaseUser.id,
    aud: supabaseUser.aud || 'authenticated',
    role: supabaseUser.role || 'authenticated',
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
  } : null

  return <TaskDashboard user={user} />
} 