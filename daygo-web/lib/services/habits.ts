import { supabase } from '../supabase'
import type { Habit, HabitLog, HabitWithLog, HabitMissNote } from '../types/database'

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

    // Fetch miss notes for the date (gracefully handle if table doesn't exist yet)
    let typedMissNotes: HabitMissNote[] = []
    try {
      const { data: missNotes, error: missNotesError } = await supabase
        .from('habit_miss_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)

      if (!missNotesError) {
        typedMissNotes = (missNotes as HabitMissNote[]) ?? []
      }
    } catch {
      // Table might not exist yet, continue without miss notes
    }

    const typedHabits = habits as Habit[] ?? []
    const typedLogs = logs as HabitLog[] ?? []
    const logsMap = new Map(typedLogs.map((log) => [log.habit_id, log]))
    const missNotesMap = new Map(typedMissNotes.map((note) => [note.habit_id, note]))

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
      missNote: missNotesMap.get(habit.id)?.note ?? null,
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
    // Get all habits (including deactivated ones for historical accuracy)
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (habitsError) throw habitsError

    // Get all logs in the date range
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (logsError) throw logsError

    const typedHabits = habits as Habit[] ?? []
    const typedLogs = logs as HabitLog[] ?? []

    // Calculate score for each day in the range
    const results: { date: string; score: number }[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]

      // Filter habits that existed on this day
      const dayHabits = typedHabits.filter((habit: any) => {
        const habitCreatedDate = habit.created_at.split('T')[0]
        const wasCreatedBefore = habitCreatedDate <= dateStr
        const isNotDeactivated = !habit.deactivated_at
        const wasDeactivatedAfter = habit.deactivated_at && habit.deactivated_at > dateStr
        return wasCreatedBefore && (isNotDeactivated || wasDeactivatedAfter)
      })

      if (dayHabits.length === 0) {
        results.push({ date: dateStr, score: 0 })
        continue
      }

      // Count completed habits for this day
      const dayLogs = typedLogs.filter(log => log.date === dateStr && log.completed)
      const completedHabitIds = new Set(dayLogs.map(log => log.habit_id))
      const completedCount = dayHabits.filter(h => completedHabitIds.has(h.id)).length

      const score = Math.round((completedCount / dayHabits.length) * 100)
      results.push({ date: dateStr, score })
    }

    return results
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

  async getHabitCompletionStats(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ habit: Habit; completionCount: number }[]> {
    // Get all active habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (habitsError) throw habitsError

    // Get completed logs for this user (optionally filtered by date range)
    let logsQuery = supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('completed', true)

    if (startDate) {
      logsQuery = logsQuery.gte('date', startDate)
    }
    if (endDate) {
      logsQuery = logsQuery.lte('date', endDate)
    }

    const { data: logs, error: logsError } = await logsQuery

    if (logsError) throw logsError

    const typedHabits = habits as Habit[] ?? []
    const typedLogs = (logs as { habit_id: string }[]) ?? []

    // Count completions per habit
    const completionCounts = new Map<string, number>()
    for (const log of typedLogs) {
      const count = completionCounts.get(log.habit_id) || 0
      completionCounts.set(log.habit_id, count + 1)
    }

    // Map habits to their completion counts and sort
    return typedHabits
      .map((habit) => ({
        habit,
        completionCount: completionCounts.get(habit.id) || 0,
      }))
      .sort((a, b) => b.completionCount - a.completionCount)
  },
}
