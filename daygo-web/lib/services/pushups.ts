import { supabase } from '../supabase'
import type { PushupLog } from '../types/database'

export const pushupsService = {
  async getLog(userId: string, date: string): Promise<PushupLog | null> {
    const { data, error } = await supabase
      .from('pushup_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()

    if (error) throw error
    return data as PushupLog | null
  },

  async getLogs(userId: string, limit = 30): Promise<PushupLog[]> {
    const { data, error } = await supabase
      .from('pushup_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return ((data as PushupLog[]) ?? []).reverse()
  },

  async upsertLog(userId: string, date: string, count: number): Promise<PushupLog> {
    const { data, error } = await (supabase
      .from('pushup_logs') as any)
      .upsert(
        { user_id: userId, date, count },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) throw error
    return data as PushupLog
  },
}
