'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, TrendingUp, Calendar } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { kanbanService } from '@/lib/services/kanban'
import type { KanbanCard } from '@/lib/types/database'

// Get Monday of the current week
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Get Sunday of the current week
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

// Format date to display
function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatDayNumber(date: Date): string {
  return date.getDate().toString()
}

// Check if date is today
function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// Get array of dates for the week
function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    days.push(day)
  }
  return days
}

// Group cards by completion date
function groupCardsByDay(cards: KanbanCard[]): Map<string, KanbanCard[]> {
  const grouped = new Map<string, KanbanCard[]>()

  cards.forEach(card => {
    if (card.completed_at) {
      const dateKey = new Date(card.completed_at).toDateString()
      const existing = grouped.get(dateKey) || []
      grouped.set(dateKey, [...existing, card])
    }
  })

  return grouped
}

export function KanbanStats() {
  const { user } = useAuthStore()

  const weekStart = getWeekStart(new Date())
  const weekEnd = getWeekEnd(new Date())
  const weekDays = getWeekDays(weekStart)

  const { data: completedCards = [], isLoading } = useQuery({
    queryKey: ['kanban-stats', user?.id, weekStart.toISOString()],
    queryFn: () => kanbanService.getCompletedCardsByDateRange(
      user!.id,
      weekStart.toISOString(),
      weekEnd.toISOString()
    ),
    enabled: !!user,
  })

  const cardsByDay = groupCardsByDay(completedCards)
  const totalCompleted = completedCards.length
  const maxInDay = Math.max(1, ...weekDays.map(day => cardsByDay.get(day.toDateString())?.length || 0))

  // Calculate streak (consecutive days with completions ending today or yesterday)
  const getStreak = (): number => {
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i <= 6; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const hasCompletions = cardsByDay.has(checkDate.toDateString())

      if (i === 0 && !hasCompletions) {
        // Today has no completions, check from yesterday
        continue
      }

      if (hasCompletions) {
        streak++
      } else if (streak > 0) {
        break
      }
    }

    return streak
  }

  const streak = getStreak()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500 dark:text-slate-400">
          Loading stats...
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Week Header */}
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          This Week
        </h2>
        <span className="text-sm text-gray-500 dark:text-slate-400">
          {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-slate-400">Completed</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalCompleted}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">cards this week</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-500 dark:text-slate-400">Streak</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {streak}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">day{streak !== 1 ? 's' : ''} in a row</p>
        </div>
      </div>

      {/* Daily Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
          Daily Accomplishments
        </h3>

        <div className="flex items-end justify-between gap-2 h-40">
          {weekDays.map((day) => {
            const count = cardsByDay.get(day.toDateString())?.length || 0
            const heightPercent = maxInDay > 0 ? (count / maxInDay) * 100 : 0
            const isTodayDay = isToday(day)

            return (
              <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-2">
                {/* Count */}
                <span className={`text-xs font-medium ${
                  count > 0
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-slate-500'
                }`}>
                  {count}
                </span>

                {/* Bar */}
                <div className="w-full h-24 flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      count > 0
                        ? isTodayDay
                          ? 'bg-accent'
                          : 'bg-green-500'
                        : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                    style={{
                      height: count > 0 ? `${Math.max(heightPercent, 10)}%` : '4px'
                    }}
                  />
                </div>

                {/* Day Label */}
                <div className="text-center">
                  <p className={`text-xs ${
                    isTodayDay
                      ? 'text-accent font-semibold'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}>
                    {formatDayLabel(day)}
                  </p>
                  <p className={`text-xs ${
                    isTodayDay
                      ? 'text-accent font-semibold'
                      : 'text-gray-400 dark:text-slate-500'
                  }`}>
                    {formatDayNumber(day)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completed Cards List */}
      {completedCards.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            Recently Completed
          </h3>
          <div className="space-y-2">
            {completedCards.slice(0, 10).map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white line-through">
                      {card.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                    {card.completed_at && new Date(card.completed_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {completedCards.length === 0 && (
        <div className="mt-8 text-center py-8">
          <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </div>
          <p className="text-gray-500 dark:text-slate-400">
            No cards completed this week yet
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Complete tasks on your board to see your progress here
          </p>
        </div>
      )}
    </div>
  )
}
