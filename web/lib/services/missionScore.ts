import type { HabitWithLog, Todo, ScheduleEvent } from '../types/database'

export interface MissionScore {
  total: number // 0-100
  breakdown: {
    habits: { completed: number; total: number }
    todos: { completed: number; total: number }
    schedule: { completed: number; total: number }
  }
}

export function calculateMissionScore(
  habits: HabitWithLog[],
  todos: Todo[],
  scheduleEvents: ScheduleEvent[]
): MissionScore {
  const habitStats = {
    completed: habits.filter(h => h.completed).length,
    total: habits.length,
  }

  const todoStats = {
    completed: todos.filter(t => t.completed).length,
    total: todos.length,
  }

  const scheduleStats = {
    completed: scheduleEvents.filter(e => e.completed).length,
    total: scheduleEvents.length,
  }

  const totalCompleted = habitStats.completed + todoStats.completed + scheduleStats.completed
  const totalItems = habitStats.total + todoStats.total + scheduleStats.total

  const score = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  return {
    total: score,
    breakdown: {
      habits: habitStats,
      todos: todoStats,
      schedule: scheduleStats,
    },
  }
}
