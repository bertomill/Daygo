import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  initialized: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    set({ isLoading: false });
    return { error };
  },

  signUp: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    set({ isLoading: false });
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  deleteAccount: async () => {
    const { user } = get();
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Delete user's profile (cascades to habits, goals, etc.)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sign out
      await supabase.auth.signOut();
      set({ session: null, user: null });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, initialized: true });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },
}));
