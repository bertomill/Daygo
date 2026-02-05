import { supabase } from '../supabase'

export interface CrystalDayLog {
  id: string
  user_id: string
  date: string
  item_key: string
  completed: boolean
  note: string | null
  created_at: string
}

export const crystalDayLogsService = {
  async getLogs(userId: string, date: string): Promise<CrystalDayLog[]> {
    const { data, error } = await (supabase
      .from('crystal_day_logs') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)

    if (error) throw error
    return (data as CrystalDayLog[]) ?? []
  },

  async upsertLog(
    userId: string,
    date: string,
    itemKey: string,
    updates: { completed?: boolean; note?: string | null }
  ): Promise<CrystalDayLog> {
    const { data, error } = await (supabase
      .from('crystal_day_logs') as any)
      .upsert(
        {
          user_id: userId,
          date,
          item_key: itemKey,
          ...updates,
        },
        { onConflict: 'user_id,date,item_key' }
      )
      .select()
      .single()

    if (error) throw error
    return data as CrystalDayLog
  },
}
