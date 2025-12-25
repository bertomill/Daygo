import { supabase } from '@/lib/supabase'
import type { UserPreferences } from '@/lib/types/database'

// Default preferences
const DEFAULT_PREFERENCES = {
  wake_time: '07:00:00',
  bed_time: '22:00:00',
}

export const userPreferencesService = {
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getOrCreatePreferences(userId: string): Promise<UserPreferences> {
    // Try to get existing preferences
    const existing = await this.getPreferences(userId)
    if (existing) return existing

    // Create default preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        wake_time: DEFAULT_PREFERENCES.wake_time,
        bed_time: DEFAULT_PREFERENCES.bed_time,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updatePreferences(
    userId: string,
    updates: { wake_time?: string; bed_time?: string }
  ): Promise<UserPreferences> {
    // Ensure preferences exist first
    await this.getOrCreatePreferences(userId)

    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Helper to format time for display (HH:MM:SS -> HH:MM)
  formatTimeForDisplay(time: string): string {
    return time.slice(0, 5)
  },

  // Helper to format time for DB (HH:MM -> HH:MM:SS)
  formatTimeForDB(time: string): string {
    return time.length === 5 ? `${time}:00` : time
  },
}
