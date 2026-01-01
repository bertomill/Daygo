import type { HabitWithLog, Todo, ScheduleEvent } from '../types/database'

export interface MissionScore {
  total: number // 0-100
  breakdown: {
    todos: { completed: number; total: number }
    schedule: { completed: number; total: number }
  }
}

export function calculateMissionScore(
  habits: HabitWithLog[],
  todos: Todo[],
  scheduleEvents: ScheduleEvent[]
): MissionScore {
  const todoStats = {
    completed: todos.filter(t => t.completed).length,
    total: todos.length,
  }

  const scheduleStats = {
    completed: scheduleEvents.filter(e => e.completed).length,
    total: scheduleEvents.length,
  }

  const totalCompleted = todoStats.completed + scheduleStats.completed
  const totalItems = todoStats.total + scheduleStats.total

  const score = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  return {
    total: score,
    breakdown: {
      todos: todoStats,
      schedule: scheduleStats,
    },
  }
}
