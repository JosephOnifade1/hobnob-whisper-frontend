
import { supabase } from '@/integrations/supabase/client'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface SignUpData {
  email: string
  password: string
  fullName?: string
  username?: string
}

export interface SignInData {
  email: string
  password: string
}

// Authentication methods
export const auth = {
  // Sign up new user
  signUp: async ({ email, password, fullName, username }: SignUpData): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        }
      }
    })
    
    return {
      user: data.user,
      session: data.session,
      error
    }
  },

  // Sign in existing user
  signIn: async ({ email, password }: SignInData): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return {
      user: data.user,
      session: data.session,
      error
    }
  },

  // Sign out current user
  signOut: async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async (): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  getCurrentSession: async (): Promise<{ session: Session | null; error: AuthError | null }> => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Real-time subscriptions
export const realtime = {
  // Subscribe to table changes
  subscribeToTable: (
    table: string,
    callback: (payload: any) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ) => {
    return supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to user's conversations
  subscribeToUserConversations: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('user-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to conversation messages
  subscribeToConversationMessages: (conversationId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`conversation-${conversationId}-messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )
      .subscribe()
  },

  // Unsubscribe from channel
  unsubscribe: (channel: any) => {
    return supabase.removeChannel(channel)
  }
}

// Export the configured Supabase client
export { supabase }
export default supabase
