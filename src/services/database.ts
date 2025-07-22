
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

const logDatabaseOperation = (operation: string, table: string, data?: any) => {
  console.log(`Database ${operation} on ${table}:`, data);
};

const handleDatabaseError = (operation: string, table: string, error: any): DatabaseError => {
  const dbError: DatabaseError = {
    message: error.message || 'Unknown database error',
    code: error.code,
    details: error.details
  };
  
  console.error(`Database ${operation} error on ${table}:`, dbError);
  return dbError;
};

// Conversation functions
export const conversationService = {
  // Create a new conversation
  create: async (data: Omit<ConversationInsert, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Conversation | null; error: DatabaseError | null }> => {
    logDatabaseOperation('CREATE', 'conversations', data);
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('CREATE', 'conversations', error)
      };
    }

    console.log('Conversation created successfully:', conversation.id);
    return { data: conversation, error: null };
  },

  // Get all conversations for a user
  getUserConversations: async (userId: string): Promise<{ data: Conversation[] | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_USER_CONVERSATIONS', 'conversations', { userId });
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_USER_CONVERSATIONS', 'conversations', error)
      };
    }

    console.log(`Retrieved ${data?.length || 0} conversations for user:`, userId);
    return { data, error: null };
  },

  // Get a specific conversation
  getById: async (id: string): Promise<{ data: Conversation | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_BY_ID', 'conversations', { id });
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_BY_ID', 'conversations', error)
      };
    }

    console.log('Retrieved conversation:', data.id);
    return { data, error: null };
  },

  // Update a conversation
  update: async (id: string, updates: ConversationUpdate): Promise<{ data: Conversation | null; error: DatabaseError | null }> => {
    logDatabaseOperation('UPDATE', 'conversations', { id, updates });
    
    const { data, error } = await supabase
      .from('conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('UPDATE', 'conversations', error)
      };
    }

    console.log('Updated conversation:', data.id);
    return { data, error: null };
  },

  // Delete a conversation and all its messages
  delete: async (id: string): Promise<{ error: DatabaseError | null }> => {
    logDatabaseOperation('DELETE', 'conversations', { id });
    
    // First delete all messages associated with this conversation
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id)

    if (messagesError) {
      return {
        error: handleDatabaseError('DELETE_MESSAGES', 'messages', messagesError)
      };
    }

    // Then delete the conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (conversationError) {
      return {
        error: handleDatabaseError('DELETE', 'conversations', conversationError)
      };
    }

    console.log('Deleted conversation and associated messages:', id);
    return { error: null };
  }
}

// Message functions
export const messageService = {
  // Create a new message
  create: async (data: Omit<MessageInsert, 'id' | 'created_at'>): Promise<{ data: Message | null; error: DatabaseError | null }> => {
    logDatabaseOperation('CREATE', 'messages', {
      conversation_id: data.conversation_id,
      role: data.role,
      contentLength: data.content.length
    });
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert(data)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('CREATE', 'messages', error)
      };
    }

    console.log('Message created successfully:', message.id);
    return { data: message, error: null };
  },

  // Get messages for a conversation
  getByConversationId: async (conversationId: string): Promise<{ data: Message[] | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_BY_CONVERSATION', 'messages', { conversationId });
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_BY_CONVERSATION', 'messages', error)
      };
    }

    console.log(`Retrieved ${data?.length || 0} messages for conversation:`, conversationId);
    return { data, error: null };
  },

  // Get chat history for a user (with conversation details)
  getUserChatHistory: async (userId: string): Promise<{ data: any[] | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_USER_CHAT_HISTORY', 'conversations', { userId });
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_USER_CHAT_HISTORY', 'conversations', error)
      };
    }

    console.log(`Retrieved chat history for user:`, userId);
    return { data, error: null };
  }
}

// Profile functions
export const profileService = {
  // Get user profile
  getById: async (id: string): Promise<{ data: Profile | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_BY_ID', 'profiles', { id });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_BY_ID', 'profiles', error)
      };
    }

    return { data, error: null };
  },

  // Update user profile
  update: async (id: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: DatabaseError | null }> => {
    logDatabaseOperation('UPDATE', 'profiles', { id, updates });
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('UPDATE', 'profiles', error)
      };
    }

    return { data, error: null };
  }
}

// User settings functions
export const userSettingsService = {
  // Get user settings
  getByUserId: async (userId: string): Promise<{ data: UserSettings | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_BY_USER_ID', 'user_settings', { userId });
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_BY_USER_ID', 'user_settings', error)
      };
    }

    return { data, error: null };
  },

  // Update user settings
  update: async (userId: string, updates: Omit<UserSettingsUpdate, 'user_id'>): Promise<{ data: UserSettings | null; error: DatabaseError | null }> => {
    logDatabaseOperation('UPDATE', 'user_settings', { userId, updates });
    
    const { data, error } = await supabase
      .from('user_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('UPDATE', 'user_settings', error)
      };
    }

    return { data, error: null };
  }
}

// Tool usage analytics functions
export const toolUsageService = {
  // Log tool usage
  log: async (data: Omit<ToolUsageLogInsert, 'id' | 'created_at'>): Promise<{ data: ToolUsageLog | null; error: DatabaseError | null }> => {
    logDatabaseOperation('LOG', 'tool_usage_logs', data);
    
    const { data: log, error } = await supabase
      .from('tool_usage_logs')
      .insert(data)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('LOG', 'tool_usage_logs', error)
      };
    }

    return { data: log, error: null };
  },

  // Get user's tool usage history
  getUserUsage: async (userId: string, limit?: number): Promise<{ data: ToolUsageLog[] | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_USER_USAGE', 'tool_usage_logs', { userId, limit });
    
    let query = supabase
      .from('tool_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_USER_USAGE', 'tool_usage_logs', error)
      };
    }

    return { data, error: null };
  },

  // Get usage analytics for a specific tool
  getToolAnalytics: async (userId: string, toolName: string): Promise<{ data: ToolUsageLog[] | null; error: DatabaseError | null }> => {
    logDatabaseOperation('GET_TOOL_ANALYTICS', 'tool_usage_logs', { userId, toolName });
    
    const { data, error } = await supabase
      .from('tool_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('tool_name', toolName)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: handleDatabaseError('GET_TOOL_ANALYTICS', 'tool_usage_logs', error)
      };
    }

    return { data, error: null };
  }
}
