
// Database schema types based on Supabase tables
export interface UserProfile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ChatConversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: any[]
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  theme: string // Changed from 'light' | 'dark' to string to match Supabase response
  language: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ToolUsageLog {
  id: string
  user_id: string
  tool_name: string
  usage_data: Record<string, any>
  success: boolean
  error_message?: string
  created_at: string
}

// Insert types (for creating new records)
export interface UserProfileInsert {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
}

export interface ChatConversationInsert {
  user_id: string
  title?: string
}

export interface ChatMessageInsert {
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: any[]
}

export interface UserSettingsInsert {
  user_id: string
  theme?: string // Changed from 'light' | 'dark' to string
  language?: string
  preferences?: Record<string, any>
}

export interface ToolUsageLogInsert {
  user_id: string
  tool_name: string
  usage_data?: Record<string, any>
  success?: boolean
  error_message?: string
}

// Update types (for updating existing records)
export interface UserProfileUpdate {
  username?: string
  full_name?: string
  avatar_url?: string
  updated_at?: string
}

export interface ChatConversationUpdate {
  title?: string
  updated_at?: string
}

export interface UserSettingsUpdate {
  theme?: string // Changed from 'light' | 'dark' to string
  language?: string
  preferences?: Record<string, any>
  updated_at?: string
}

// API Response types
export interface DatabaseResponse<T> {
  data: T | null
  error: DatabaseError | null
}

export interface DatabaseError {
  message: string
  code?: string
  details?: string
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  created_at: string
  updated_at: string
  email_confirmed_at?: string
  phone?: string
  phone_confirmed_at?: string
  last_sign_in_at?: string
  role?: string
  user_metadata?: Record<string, any>
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: AuthUser
}

export interface AuthResponse {
  user: AuthUser | null
  session: AuthSession | null
  error: AuthError | null
}

export interface AuthError {
  message: string
  status?: number
}

// Real-time subscription types
export interface RealtimePayload<T = any> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  errors?: string[]
}

export interface RealtimeSubscription {
  unsubscribe: () => void
}
