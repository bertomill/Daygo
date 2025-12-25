import { supabase } from '../supabase'
import type { HabitMissNote } from '../types/database'

export const habitMissNotesService = {
  async getMissNotesForDate(userId: string, date: string): Promise<HabitMissNote[]> {
    const { data, error } = await supabase
      .from('habit_miss_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)

    if (error) throw error
    return (data as HabitMissNote[]) ?? []
  },

  async getMissNoteForHabit(
    userId: string,
    habitId: string,
    date: string
  ): Promise<HabitMissNote | null> {
    const { data, error } = await supabase
      .from('habit_miss_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as HabitMissNote
  },

  async createMissNote(
    userId: string,
    habitId: string,
    date: string,
    note: string
  ): Promise<HabitMissNote> {
    const { data, error } = await supabase
      .from('habit_miss_notes')
      .upsert(
        {
          user_id: userId,
          habit_id: habitId,
          date,
          note,
        } as any,
        {
          onConflict: 'habit_id,date',
        }
      )
      .select()
      .single()

    if (error) throw error
    return data as HabitMissNote
  },

  async deleteMissNote(habitId: string, date: string): Promise<void> {
    const { error } = await (supabase
      .from('habit_miss_notes') as any)
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date)

    if (error) throw error
  },
}
