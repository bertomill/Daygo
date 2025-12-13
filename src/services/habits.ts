import { supabase } from './supabase';
import { Habit, HabitLog, HabitWithLog } from '../types/database';

export const habitsService = {
  // Get all active habits for a user
  async getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as Habit[]) ?? [];
  },

  // Get habits with today's completion status
  async getHabitsWithLogs(userId: string, date: string): Promise<HabitWithLog[]> {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (habitsError) throw habitsError;

    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    if (logsError) throw logsError;

    const typedHabits = habits as Habit[] ?? [];
    const typedLogs = logs as HabitLog[] ?? [];
    const logsMap = new Map(typedLogs.map((log) => [log.habit_id, log]));

    // Filter habits to only show ones created on or before the selected date
    const filteredHabits = typedHabits.filter((habit) => {
      const habitCreatedDate = habit.created_at.split('T')[0];
      return habitCreatedDate <= date;
    });

    return filteredHabits.map((habit) => ({
      ...habit,
      completed: logsMap.get(habit.id)?.completed ?? false,
    }));
  },

  // Create a new habit
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
      .single();

    if (error) throw error;
    return data as Habit;
  },

  // Update a habit
  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const { data, error } = await (supabase
      .from('habits') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Habit;
  },

  // Delete (deactivate) a habit
  async deleteHabit(id: string): Promise<void> {
    const { error } = await (supabase
      .from('habits') as any)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle habit completion for a date
  async toggleHabitCompletion(
    userId: string,
    habitId: string,
    date: string,
    completed: boolean,
  ): Promise<HabitLog> {
    // Upsert - insert or update
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
        },
      )
      .select()
      .single();

    if (error) throw error;
    return data as HabitLog;
  },

  // Get daily score for a specific date
  async getDailyScore(userId: string, date: string): Promise<number> {
    const { data, error } = await supabase
      .from('daily_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return (data as any)?.score ?? 0;
  },

  // Get score history for date range
  async getScoreHistory(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ date: string; score: number }[]> {
    const { data, error } = await supabase
      .from('daily_scores')
      .select('date, score')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data as any[]) ?? [];
  },

  // Update sort order for a habit
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    const { error } = await (supabase
      .from('habits') as any)
      .update({ sort_order: sortOrder })
      .eq('id', id);

    if (error) throw error;
  },

  // Batch update sort orders
  async reorderHabits(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      await this.updateSortOrder(update.id, update.sort_order);
    }
  },
};
