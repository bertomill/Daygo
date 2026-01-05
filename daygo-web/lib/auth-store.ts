import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
  initialized: boolean
  setSession: (session: Session | null) => void
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  initialized: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null })
  },

  signIn: async (email, password) => {
    set({ isLoading: true })
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    set({ isLoading: false })
    return { error }
  },

  signUp: async (email, password) => {
    set({ isLoading: true })
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    set({ isLoading: false })
    return { error }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    set({ isLoading: false })
    return { error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, initialized: true })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },
}))
