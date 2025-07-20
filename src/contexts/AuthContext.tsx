
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth, type AuthResponse, type SignUpData, type SignInData } from '@/lib/supabase'
import { profileService, userSettingsService } from '@/services/database'
import type { UserProfile, UserSettings } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  settings: UserSettings | null
  loading: boolean
  signUp: (data: SignUpData) => Promise<AuthResponse>
  signIn: (data: SignInData) => Promise<AuthResponse>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await auth.getCurrentSession()
        if (session && !error) {
          setSession(session)
          setUser(session.user)
          await loadUserData(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Use setTimeout to avoid potential deadlocks
        setTimeout(() => {
          loadUserData(session.user.id)
        }, 0)
      } else {
        setProfile(null)
        setSettings(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const { data: profileData } = await profileService.getById(userId)
      if (profileData) {
        setProfile(profileData)
      }

      // Load user settings
      const { data: settingsData } = await userSettingsService.getByUserId(userId)
      if (settingsData) {
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const signUp = async (data: SignUpData): Promise<AuthResponse> => {
    setLoading(true)
    try {
      const result = await auth.signUp(data)
      return result
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: SignInData): Promise<AuthResponse> => {
    setLoading(true)
    try {
      const result = await auth.signIn(data)
      return result
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    console.log('Signing out user...')
    setLoading(true)
    try {
      const { error } = await auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      
      // Clear all state immediately
      setUser(null)
      setSession(null)
      setProfile(null)
      setSettings(null)
      
      console.log('User signed out successfully')
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No authenticated user')
    
    const { data, error } = await profileService.update(user.id, updates)
    if (error) throw new Error(error.message)
    
    if (data) {
      setProfile(data)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>): Promise<void> => {
    if (!user) throw new Error('No authenticated user')
    
    const { data, error } = await userSettingsService.update(user.id, updates)
    if (error) throw new Error(error.message)
    
    if (data) {
      setSettings(data)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    settings,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateSettings
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
