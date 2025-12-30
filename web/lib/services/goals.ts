import { supabase } from '../supabase'
import type { Goal, GoalWithHabits, Habit } from '../types/database'

// Service object for all goal-related operations
export const goalsService = {
  // Fetch all goals for a given user, ordered by creation date (newest first)
  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) // sort by newest

    if (error) throw error
    // Always return an array; empty if no goals found
    return (data as Goal[]) ?? []
  },

  // Fetch all goals for a user, including their linked habits and progress
  async getGoalsWithHabits(userId: string): Promise<GoalWithHabits[]> {
    // Get all goals for the user
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (goalsError) throw goalsError

    // Get all habit-goal link rows (for mapping)
    const { data: links, error: linksError } = await supabase
      .from('habit_goal_links')
      .select('goal_id, habit_id')

    if (linksError) throw linksError

    // Get all active habits for the user
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (habitsError) throw habitsError

    // Ensure correct types, default to empty arrays if null
    const typedGoals = goals as Goal[] ?? []
    const typedHabits = habits as Habit[] ?? []
    const typedLinks = links as { goal_id: string; habit_id: string }[] ?? []

    // Build the result array: each goal with its related habits and computed progress
    return typedGoals.map((goal) => {
      // Find all habit IDs linked to this goal
      const goalHabitIds = typedLinks
        .filter((link) => link.goal_id === goal.id)
        .map((link) => link.habit_id)
      // Get full habit objects for those IDs
      const goalHabits = typedHabits.filter((h) => goalHabitIds.includes(h.id))
      // Calculate progress as a percentage (capped to 100%)
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

  // Fetch a single goal with its linked habits and computed progress, by goal id
  async getGoalById(id: string): Promise<GoalWithHabits | null> {
    // Fetch the goal row
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (goalError) return null

    // Fetch all links for this goal (get linked habit ids)
    const { data: links } = await supabase
      .from('habit_goal_links')
      .select('habit_id')
      .eq('goal_id', id)

    // Extract habit ids from the link rows
    const habitIds = (links ?? []).map((l: any) => l.habit_id)

    let habits: Habit[] = []
    // Only query habits if there are linked ids
    if (habitIds.length > 0) {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .in('id', habitIds)
      habits = (habitsData as Habit[]) ?? []
    }

    // Make sure our goal is correctly typed
    const typedGoal = goal as Goal
    // Calculate progress for this goal
    const progress = typedGoal.metric_target > 0
      ? Math.min(100, (typedGoal.metric_current / typedGoal.metric_target) * 100)
      : 0

    // Return combined object as GoalWithHabits
    return {
      ...typedGoal,
      habits,
      progress,
    }
  },

  // Create a new goal and link to the given habit ids
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
    // Insert the goal record
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

    // Link habits to the new goal, if any given
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

    // Return the created goal
    return goal
  },

  // Update a goal's current metric value (progress)
  async updateGoalProgress(id: string, metricCurrent: number): Promise<Goal> {
    // Update the metric_current field for the matching goal
    const { data, error } = await (supabase
      .from('goals') as any)
      .update({ metric_current: metricCurrent })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Goal
  },

  // Update a goal's properties and its linked habits
  async updateGoal(
    id: string,
    title: string,
    description: string | null,
    icon: string | null,
    metricName: string,
    metricTarget: number,
    deadline: string | null,
    linkedHabitIds: string[]
  ): Promise<Goal> {
    // Update goal's fields (title, description, etc.)
    const { data, error } = await (supabase
      .from('goals') as any)
      .update({
        title,
        description,
        icon,
        metric_name: metricName,
        metric_target: metricTarget,
        deadline,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Remove all existing habit links for this goal
    await supabase
      .from('habit_goal_links')
      .delete()
      .eq('goal_id', id)

    // Create new links for the selected habits
    if (linkedHabitIds.length > 0) {
      await supabase
        .from('habit_goal_links')
        .insert(
          linkedHabitIds.map((habitId) => ({
            goal_id: id,
            habit_id: habitId,
          })) as any
        )
    }

    return data as Goal
  },

  // Delete a goal and all of its habit links
  async deleteGoal(id: string): Promise<void> {
    // First, delete all habit links for this goal
    await supabase
      .from('habit_goal_links')
      .delete()
      .eq('goal_id', id)

    // Then, delete the goal itself
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
