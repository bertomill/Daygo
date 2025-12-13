import { supabase } from '../supabase'
import type { Habit, HabitLog, HabitWithLog } from '../../../src/types/database'

export const habitsService = {
  async getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data as Habit[]) ?? []
  },

  async getHabitsWithLogs(userId: string, date: string): Promise<HabitWithLog[]> {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (habitsError) throw habitsError

    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)

    if (logsError) throw logsError

    const typedHabits = habits as Habit[] ?? []
    const typedLogs = logs as HabitLog[] ?? []
    const logsMap = new Map(typedLogs.map((log) => [log.habit_id, log]))

    // Filter habits to only show ones:
    // 1. Created on or before the selected date
    // 2. Not deactivated, OR deactivated after the selected date
    const filteredHabits = typedHabits.filter((habit: any) => {
      const habitCreatedDate = habit.created_at.split('T')[0]
      const wasCreatedBefore = habitCreatedDate <= date
      const isNotDeactivated = !habit.deactivated_at
      const wasDeactivatedAfter = habit.deactivated_at && habit.deactivated_at > date
      return wasCreatedBefore && (isNotDeactivated || wasDeactivatedAfter)
    })

    return filteredHabits.map((habit) => ({
      ...habit,
      completed: logsMap.get(habit.id)?.completed ?? false,
    }))
  },

  async createHabit(
    userId: string,
    name: string,
    description?: string,
    weight: number = 1
  ): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name,
        description: description || null,
        weight,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Habit
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const { data, error } = await (supabase
      .from('habits') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Habit
  },

  async deleteHabit(id: string, fromDate?: string): Promise<void> {
    // Set deactivated_at to the given date (defaults to today)
    // This keeps the habit visible for previous days but hides it from this date forward
    const deactivatedAt = fromDate || new Date().toISOString().split('T')[0]

    const { error } = await (supabase
      .from('habits') as any)
      .update({ deactivated_at: deactivatedAt })
      .eq('id', id)

    if (error) throw error
  },

  async toggleHabitCompletion(
    userId: string,
    habitId: string,
    date: string,
    completed: boolean
  ): Promise<HabitLog> {
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert(
        {
          user_id: userId,
          habit_id: habitId,
          date,
          completed,
        } as any,
        {
          onConflict: 'habit_id,date',
        }
      )
      .select()
      .single()

    if (error) throw error
    return data as HabitLog
  },

  async getDailyScore(userId: string, date: string): Promise<number> {
    const { data, error } = await supabase
      .from('daily_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return (data as any)?.score ?? 0
  },

  async getScoreHistory(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ date: string; score: number }[]> {
    const { data, error } = await supabase
      .from('daily_scores')
      .select('date, score')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return (data as any[]) ?? []
  },

  async reorderHabits(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await (supabase
        .from('habits') as any)
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
      if (error) throw error
    }
  },
}
