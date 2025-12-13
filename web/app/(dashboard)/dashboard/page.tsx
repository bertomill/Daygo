'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Flame, Trophy } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { habitsService } from '@/lib/services/habits'

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

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { start, end } = getDateRange(7)

  const { data: scoreHistory = [], isLoading } = useQuery({
    queryKey: ['score-history', user?.id, start, end],
    queryFn: () => habitsService.getScoreHistory(user!.id, start, end),
    enabled: !!user,
  })

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

  // Generate last 7 days for chart
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = formatDate(date)
    const dayData = scoreHistory.find((d) => d.date === dateStr)
    last7Days.push({
      date: dateStr,
      score: dayData?.score ?? 0,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
    })
  }

  const maxScore = Math.max(...last7Days.map((d) => d.score), 100)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{avgScore}%</p>
          <p className="text-xs text-slate-400">Avg Score</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{streak}</p>
          <p className="text-xs text-slate-400">Day Streak</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{bestScore}%</p>
          <p className="text-xs text-slate-400">Best Day</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
          Last 7 Days
        </h2>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-slate-500">Loading...</div>
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
                return 'bg-slate-700'
              }

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-36 flex items-end">
                    <div
                      className={`w-full ${getColor(day.score)} rounded-t-md transition-all`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{day.label}</span>
                  <span className="text-xs text-slate-400">{day.score}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Motivational message */}
      <div className="mt-6 text-center">
        {streak >= 7 ? (
          <p className="text-slate-400">
            Amazing! You've maintained a {streak}-day streak! 🔥
          </p>
        ) : streak >= 3 ? (
          <p className="text-slate-400">
            Great progress! Keep building that momentum! 💪
          </p>
        ) : avgScore >= 80 ? (
          <p className="text-slate-400">
            Excellent work! You're crushing your habits! ⭐
          </p>
        ) : (
          <p className="text-slate-400">
            Every day is a fresh start. You've got this! 🌟
          </p>
        )}
      </div>
    </div>
  )
}
