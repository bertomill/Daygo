import { supabase } from './supabase';
import { Goal, GoalWithHabits, Habit, HabitGoalLink } from '../types/database';

export const goalsService = {
  // Get all goals for a user
  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Goal[]) ?? [];
  },

  // Get a single goal with linked habits
  async getGoalWithHabits(goalId: string): Promise<GoalWithHabits | null> {
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalError) throw goalError;
    if (!goal) return null;

    const typedGoal = goal as Goal;

    const { data: links, error: linksError } = await supabase
      .from('habit_goal_links')
      .select('habit_id')
      .eq('goal_id', goalId);

    if (linksError) throw linksError;

    const typedLinks = links as HabitGoalLink[] ?? [];
    const habitIds = typedLinks.map((l) => l.habit_id);
    let habits: Habit[] = [];

    if (habitIds.length > 0) {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .in('id', habitIds);

      if (habitsError) throw habitsError;
      habits = (habitsData as Habit[]) ?? [];
    }

    const progress =
      typedGoal.metric_target > 0
        ? Math.min(100, Math.round((typedGoal.metric_current / typedGoal.metric_target) * 100))
        : 0;

    return {
      ...typedGoal,
      habits,
      progress,
    };
  },

  // Get all goals with their linked habits
  async getGoalsWithHabits(userId: string): Promise<GoalWithHabits[]> {
    const goals = await this.getGoals(userId);

    const goalsWithHabits = await Promise.all(
      goals.map(async (goal) => {
        const { data: links } = await supabase
          .from('habit_goal_links')
          .select('habit_id')
          .eq('goal_id', goal.id);

        const typedLinks = links as HabitGoalLink[] ?? [];
        const habitIds = typedLinks.map((l) => l.habit_id);
        let habits: Habit[] = [];

        if (habitIds.length > 0) {
          const { data: habitsData } = await supabase
            .from('habits')
            .select('*')
            .in('id', habitIds);
          habits = (habitsData as Habit[]) ?? [];
        }

        const progress =
          goal.metric_target > 0
            ? Math.min(100, Math.round((goal.metric_current / goal.metric_target) * 100))
            : 0;

        return { ...goal, habits, progress };
      }),
    );

    return goalsWithHabits;
  },

  // Create a new goal
  async createGoal(
    userId: string,
    goal: {
      title: string;
      description?: string;
      metric_name: string;
      metric_target: number;
      deadline?: string;
    },
    habitIds: string[] = [],
  ): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        ...goal,
      } as any)
      .select()
      .single();

    if (error) throw error;

    const typedData = data as Goal;

    // Link habits to goal
    if (habitIds.length > 0) {
      await this.linkHabitsToGoal(typedData.id, habitIds);
    }

    return typedData;
  },

  // Update a goal
  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await (supabase
      .from('goals') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  // Update goal progress
  async updateProgress(id: string, metricCurrent: number): Promise<Goal> {
    return this.updateGoal(id, { metric_current: metricCurrent });
  },

  // Delete a goal
  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);

    if (error) throw error;
  },

  // Link habits to a goal
  async linkHabitsToGoal(goalId: string, habitIds: string[]): Promise<void> {
    // Remove existing links
    await supabase.from('habit_goal_links').delete().eq('goal_id', goalId);

    // Add new links
    if (habitIds.length > 0) {
      const links = habitIds.map((habitId) => ({
        goal_id: goalId,
        habit_id: habitId,
      }));

      const { error } = await supabase.from('habit_goal_links').insert(links as any);

      if (error) throw error;
    }
  },
};
