import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const GUEST_MODE_KEY = '@daygo_guest_mode';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  isGuest: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  initialize: () => Promise<void>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  initialized: false,
  isGuest: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      set({ isGuest: false });
    }
    set({ isLoading: false });
    return { error };
  },

  signUp: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (!error) {
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      set({ isGuest: false });
    }
    set({ isLoading: false });
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'daygo://reset-password',
    });
    return { error };
  },

  deleteAccount: async () => {
    const { session, user } = get();
    if (!user || !session) return { error: new Error('No user logged in') };

    try {
      // Try to call Supabase Edge Function first (preferred method)
      const { error: functionError } = await supabase.functions.invoke(
        'delete-account',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // If function succeeds, we're done
      if (!functionError) {
        set({ session: null, user: null });
        return { error: null };
      }

      // Fallback: Delete all user data manually if function fails
      console.log('Function unavailable, using fallback deletion');

      // Delete profile (cascades to all user data due to foreign keys)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sign out (this effectively locks the account from being used)
      await supabase.auth.signOut();
      set({ session: null, user: null });

      return { error: null };
    } catch (error) {
      console.error('Delete account error:', error);
      return { error: error as Error };
    }
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    // Check if user was in guest mode
    const wasGuest = await AsyncStorage.getItem(GUEST_MODE_KEY);

    set({
      session,
      user: session?.user ?? null,
      initialized: true,
      isGuest: wasGuest === 'true' && !session
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  enterGuestMode: async () => {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    set({ isGuest: true });
  },

  exitGuestMode: async () => {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    set({ isGuest: false });
  },
}));
