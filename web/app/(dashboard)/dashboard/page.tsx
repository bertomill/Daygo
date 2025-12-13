'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Flame, Trophy, Award } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { habitsService } from '@/lib/services/habits'

type ChartRange = 'week' | 'month' | 'year' | '10years'
type HabitsRange = 'week' | 'month' | 'year' | '10years' | 'all'

const CHART_RANGE_DAYS: Record<ChartRange, number> = {
  week: 7,
  month: 30,
  year: 365,
  '10years': 3650,
}

const HABITS_RANGE_DAYS: Record<HabitsRange, number | null> = {
  week: 7,
  month: 30,
  year: 365,
  '10years': 3650,
  all: null,
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDateRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  return {
    start: formatDate(start),
    end: formatDate(end),
  }
}

function RangeToggle<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[]
  value: T
  onChange: (value: T) => void
  labels: Record<T, string>
}) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            value === option
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [chartRange, setChartRange] = useState<ChartRange>('week')
  const [habitsRange, setHabitsRange] = useState<HabitsRange>('all')

  const chartDays = CHART_RANGE_DAYS[chartRange]
  const { start, end } = getDateRange(chartDays)

  const habitsDays = HABITS_RANGE_DAYS[habitsRange]
  const habitsDateRange = habitsDays ? getDateRange(habitsDays) : null

  const { data: scoreHistory = [], isLoading } = useQuery({
    queryKey: ['score-history', user?.id, start, end],
    queryFn: () => habitsService.getScoreHistory(user!.id, start, end),
    enabled: !!user,
  })

  const { data: habitStats = [] } = useQuery({
    queryKey: ['habit-stats', user?.id, habitsDateRange?.start, habitsDateRange?.end],
    queryFn: () => habitsService.getHabitCompletionStats(
      user!.id,
      habitsDateRange?.start,
      habitsDateRange?.end
    ),
    enabled: !!user,
  })

  const topHabits = habitStats.slice(0, 5)

  // Calculate stats
  const avgScore = scoreHistory.length > 0
    ? Math.round(scoreHistory.reduce((sum, d) => sum + d.score, 0) / scoreHistory.length)
    : 0

  const bestScore = scoreHistory.length > 0
    ? Math.max(...scoreHistory.map((d) => d.score))
    : 0

  // Calculate streak (consecutive days with 80%+ score)
  let streak = 0
  const sortedHistory = [...scoreHistory].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  for (const day of sortedHistory) {
    if (day.score >= 80) {
      streak++
    } else {
      break
    }
  }

  // Generate chart data based on selected range
  const getChartData = () => {
    const data: { date: string; score: number; label: string }[] = []
    const days = chartDays

    // Determine grouping and label format based on range
    if (chartRange === 'week') {
      // Daily bars for week
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = formatDate(date)
        const dayData = scoreHistory.find((d) => d.date === dateStr)
        data.push({
          date: dateStr,
          score: dayData?.score ?? 0,
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        })
      }
    } else if (chartRange === 'month') {
      // Weekly averages for month (4-5 bars)
      const weeksCount = Math.ceil(days / 7)
      for (let w = weeksCount - 1; w >= 0; w--) {
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() - w * 7)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)

        const weekScores = scoreHistory.filter((d) => {
          const date = new Date(d.date)
          return date >= weekStart && date <= weekEnd
        })

        const avgScore = weekScores.length > 0
          ? Math.round(weekScores.reduce((sum, d) => sum + d.score, 0) / weekScores.length)
          : 0

        data.push({
          date: formatDate(weekStart),
          score: avgScore,
          label: `W${weeksCount - w}`,
        })
      }
    } else if (chartRange === 'year') {
      // Monthly averages for year (12 bars)
      for (let m = 11; m >= 0; m--) {
        const monthDate = new Date()
        monthDate.setMonth(monthDate.getMonth() - m)
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

        const monthScores = scoreHistory.filter((d) => {
          const date = new Date(d.date)
          return date >= monthStart && date <= monthEnd
        })

        const avgScore = monthScores.length > 0
          ? Math.round(monthScores.reduce((sum, d) => sum + d.score, 0) / monthScores.length)
          : 0

        data.push({
          date: formatDate(monthStart),
          score: avgScore,
          label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        })
      }
    } else {
      // Yearly averages for 10 years (10 bars)
      for (let y = 9; y >= 0; y--) {
        const yearDate = new Date()
        yearDate.setFullYear(yearDate.getFullYear() - y)
        const yearStart = new Date(yearDate.getFullYear(), 0, 1)
        const yearEnd = new Date(yearDate.getFullYear(), 11, 31)

        const yearScores = scoreHistory.filter((d) => {
          const date = new Date(d.date)
          return date >= yearStart && date <= yearEnd
        })

        const avgScore = yearScores.length > 0
          ? Math.round(yearScores.reduce((sum, d) => sum + d.score, 0) / yearScores.length)
          : 0

        data.push({
          date: formatDate(yearStart),
          score: avgScore,
          label: yearDate.getFullYear().toString().slice(-2),
        })
      }
    }

    return data
  }

  const chartData = getChartData()
  const maxScore = Math.max(...chartData.map((d) => d.score), 100)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm">
          <TrendingUp className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgScore}%</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Avg Score</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Day Streak</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm">
          <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{bestScore}%</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Best Day</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
          Last 7 Days
        </h2>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-gray-400 dark:text-slate-500">Loading...</div>
          </div>
        ) : (
          <div className="h-48 flex items-end justify-between gap-2">
            {last7Days.map((day) => {
              const height = maxScore > 0 ? (day.score / maxScore) * 100 : 0
              const getColor = (score: number) => {
                if (score >= 80) return 'bg-success'
                if (score >= 60) return 'bg-yellow-500'
                if (score >= 40) return 'bg-orange-500'
                if (score > 0) return 'bg-red-500'
                return 'bg-gray-200 dark:bg-slate-700'
              }

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-36 flex items-end">
                    <div
                      className={`w-full ${getColor(day.score)} rounded-t-md transition-all`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{day.label}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">{day.score}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top 5 Habits */}
      {topHabits.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mt-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4" />
            Top Habits by Completions
          </h2>
          <div className="space-y-3">
            {topHabits.map((item, index) => {
              const maxCount = topHabits[0]?.completionCount || 1
              const barWidth = (item.completionCount / maxCount) * 100

              return (
                <div key={item.habit.id} className="flex items-center gap-3">
                  <span className="text-gray-400 dark:text-slate-500 text-sm w-5">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-900 dark:text-white text-sm truncate">{item.habit.name}</span>
                      <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">{item.completionCount}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Motivational message */}
      <div className="mt-6 text-center">
        {streak >= 7 ? (
          <p className="text-gray-500 dark:text-slate-400">
            Amazing! You've maintained a {streak}-day streak! 🔥
          </p>
        ) : streak >= 3 ? (
          <p className="text-gray-500 dark:text-slate-400">
            Great progress! Keep building that momentum! 💪
          </p>
        ) : avgScore >= 80 ? (
          <p className="text-gray-500 dark:text-slate-400">
            Excellent work! You're crushing your habits! ⭐
          </p>
        ) : (
          <p className="text-gray-500 dark:text-slate-400">
            Every day is a fresh start. You've got this! 🌟
          </p>
        )}
      </div>
    </div>
  )
}
