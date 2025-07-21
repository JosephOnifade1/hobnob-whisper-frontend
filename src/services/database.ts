import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Tables = Database['public']['Tables']
type Conversation = Tables['conversations']['Row']
type ConversationInsert = Tables['conversations']['Insert']
type ConversationUpdate = Tables['conversations']['Update']
type Message = Tables['messages']['Row']
type MessageInsert = Tables['messages']['Insert']
type Profile = Tables['profiles']['Row']
type ProfileInsert = Tables['profiles']['Insert']
type ProfileUpdate = Tables['profiles']['Update']
type UserSettings = Tables['user_settings']['Row']
type UserSettingsInsert = Tables['user_settings']['Insert']
type UserSettingsUpdate = Tables['user_settings']['Update']
type ToolUsageLog = Tables['tool_usage_logs']['Row']
type ToolUsageLogInsert = Tables['tool_usage_logs']['Insert']

export interface DatabaseError {
  message: string
  code?: string
  details?: string
}

// Conversation functions
export const conversationService = {
  // Create a new conversation
  create: async (data: Omit<ConversationInsert, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Conversation | null; error: DatabaseError | null }> => {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single()

    return {
      data: conversation,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Get all conversations for a user
  getUserConversations: async (userId: string): Promise<{ data: Conversation[] | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Get a specific conversation
  getById: async (id: string): Promise<{ data: Conversation | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Update a conversation
  update: async (id: string, updates: ConversationUpdate): Promise<{ data: Conversation | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Delete a conversation and all its messages
  delete: async (id: string): Promise<{ error: DatabaseError | null }> => {
    // First delete all messages associated with this conversation
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id)

    if (messagesError) {
      return {
        error: { message: messagesError.message, code: messagesError.code, details: messagesError.details }
      }
    }

    // Then delete the conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    return {
      error: conversationError ? { message: conversationError.message, code: conversationError.code, details: conversationError.details } : null
    }
  }
}

// Message functions
export const messageService = {
  // Create a new message
  create: async (data: Omit<MessageInsert, 'id' | 'created_at'>): Promise<{ data: Message | null; error: DatabaseError | null }> => {
    const { data: message, error } = await supabase
      .from('messages')
      .insert(data)
      .select()
      .single()

    return {
      data: message,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Get messages for a conversation
  getByConversationId: async (conversationId: string): Promise<{ data: Message[] | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Get chat history for a user (with conversation details)
  getUserChatHistory: async (userId: string): Promise<{ data: any[] | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  }
}

// Profile functions
export const profileService = {
  // Get user profile
  getById: async (id: string): Promise<{ data: Profile | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Update user profile
  update: async (id: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  }
}

// User settings functions
export const userSettingsService = {
  // Get user settings
  getByUserId: async (userId: string): Promise<{ data: UserSettings | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Update user settings
  update: async (userId: string, updates: Omit<UserSettingsUpdate, 'user_id'>): Promise<{ data: UserSettings | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  }
}

// Tool usage analytics functions
export const toolUsageService = {
  // Log tool usage
  log: async (data: Omit<ToolUsageLogInsert, 'id' | 'created_at'>): Promise<{ data: ToolUsageLog | null; error: DatabaseError | null }> => {
    const { data: log, error } = await supabase
      .from('tool_usage_logs')
      .insert(data)
      .select()
      .single()

    return {
      data: log,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Get user's tool usage history
  getUserUsage: async (userId: string, limit?: number): Promise<{ data: ToolUsageLog[] | null; error: DatabaseError | null }> => {
    let query = supabase
      .from('tool_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  },

  // Get usage analytics for a specific tool
  getToolAnalytics: async (userId: string, toolName: string): Promise<{ data: ToolUsageLog[] | null; error: DatabaseError | null }> => {
    const { data, error } = await supabase
      .from('tool_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('tool_name', toolName)
      .order('created_at', { ascending: false })

    return {
      data,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    }
  }
}
