import { supabase } from '../supabase'

export interface PepTalk {
  id: string
  user_id: string
  text: string
  date: string
  created_at: string
}

export const pepTalksService = {
  async getPepTalkForDate(userId: string, date: string): Promise<PepTalk | null> {
    const { data, error } = await supabase
      .from('pep_talks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }
    return data as PepTalk
  },

  async savePepTalk(userId: string, text: string, date: string): Promise<PepTalk> {
    // Upsert - insert or update if exists for that date
    const { data, error } = await supabase
      .from('pep_talks')
      .upsert(
        {
          user_id: userId,
          text,
          date,
        } as any,
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) throw error
    return data as PepTalk
  },

  async deletePepTalk(userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('pep_talks')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)

    if (error) throw error
  },
}
