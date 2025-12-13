import { supabase } from '../supabase'
import type { Goal, GoalWithHabits, Habit } from '../../../src/types/database'

export const goalsService = {
  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as Goal[]) ?? []
  },

  async getGoalsWithHabits(userId: string): Promise<GoalWithHabits[]> {
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (goalsError) throw goalsError

    const { data: links, error: linksError } = await supabase
      .from('habit_goal_links')
      .select('goal_id, habit_id')

    if (linksError) throw linksError

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (habitsError) throw habitsError

    const typedGoals = goals as Goal[] ?? []
    const typedHabits = habits as Habit[] ?? []
    const typedLinks = links as { goal_id: string; habit_id: string }[] ?? []

    return typedGoals.map((goal) => {
      const goalHabitIds = typedLinks
        .filter((link) => link.goal_id === goal.id)
        .map((link) => link.habit_id)
      const goalHabits = typedHabits.filter((h) => goalHabitIds.includes(h.id))
      const progress = goal.metric_target > 0
        ? Math.min(100, (goal.metric_current / goal.metric_target) * 100)
        : 0

      return {
        ...goal,
        habits: goalHabits,
        progress,
      }
    })
  },

  async getGoalById(id: string): Promise<GoalWithHabits | null> {
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (goalError) return null

    const { data: links } = await supabase
      .from('habit_goal_links')
      .select('habit_id')
      .eq('goal_id', id)

    const habitIds = (links ?? []).map((l: any) => l.habit_id)

    let habits: Habit[] = []
    if (habitIds.length > 0) {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .in('id', habitIds)
      habits = (habitsData as Habit[]) ?? []
    }

    const typedGoal = goal as Goal
    const progress = typedGoal.metric_target > 0
      ? Math.min(100, (typedGoal.metric_current / typedGoal.metric_target) * 100)
      : 0

    return {
      ...typedGoal,
      habits,
      progress,
    }
  },

  async createGoal(
    userId: string,
    title: string,
    description: string | null,
    icon: string | null,
    metricName: string,
    metricTarget: number,
    deadline: string | null,
    linkedHabitIds: string[]
  ): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        title,
        description,
        icon,
        metric_name: metricName,
        metric_target: metricTarget,
        deadline,
      } as any)
      .select()
      .single()

    if (error) throw error

    const goal = data as Goal

    if (linkedHabitIds.length > 0) {
      await supabase
        .from('habit_goal_links')
        .insert(
          linkedHabitIds.map((habitId) => ({
            goal_id: goal.id,
            habit_id: habitId,
          })) as any
        )
    }

    return goal
  },

  async updateGoalProgress(id: string, metricCurrent: number): Promise<Goal> {
    const { data, error } = await (supabase
      .from('goals') as any)
      .update({ metric_current: metricCurrent })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Goal
  },

  async deleteGoal(id: string): Promise<void> {
    await supabase
      .from('habit_goal_links')
      .delete()
      .eq('goal_id', id)

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
