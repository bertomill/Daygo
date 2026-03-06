import { supabase } from '@/lib/supabase'
import type { DailyReflection } from '@/lib/types/database'

export const dailyReflectionsService = {
  async getReflection(userId: string, date: string): Promise<DailyReflection | null> {
    const { data, error } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async saveReflection(userId: string, date: string, answer: boolean, reason: string): Promise<DailyReflection> {
    const { data, error } = await supabase
      .from('daily_reflections')
      .upsert(
        {
          user_id: userId,
          date: date,
          answer: answer,
          reason: reason,
          updated_at: new Date().toISOString(),
        } as any,
        {
          onConflict: 'user_id,date',
        }
      )
      .select()
      .single()

    if (error) throw error
    return data as DailyReflection
  },
}
