'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import {
  analyticsService,
  type AnalyticsSummary,
  type TimeSeriesData,
  type TimePeriod
} from '@/lib/services/analytics'
import { Loader2, Users, TrendingUp, Target, CheckSquare, FileText, MessageSquare } from 'lucide-react'
import { TimePeriodToggle } from '@/components/TimePeriodToggle'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const ADMIN_EMAIL = 'bertmill19@gmail.com'

interface AnalyticCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  data: { date: string; value: number }[]
  chartColor: string
}

function AnalyticCard({ title, value, icon: Icon, color, bgColor, data, chartColor }: AnalyticCardProps) {
  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>

      {/* Mini chart */}
      <div className="h-24 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              dot={false}
            />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { user, initialized } = useAuthStore()
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day')

  useEffect(() => {
    async function fetchData() {
      if (!user || user.email !== ADMIN_EMAIL) return

      try {
        setLoading(true)
        const [summaryData, seriesData] = await Promise.all([
          analyticsService.getSummary(),
          analyticsService.getTimeSeriesData(timePeriod)
        ])
        setSummary(summaryData)
        setTimeSeriesData(seriesData)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (initialized && user?.email === ADMIN_EMAIL) {
      fetchData()
    }
  }, [user, initialized, timePeriod])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!summary || !timeSeriesData) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-slate-400">
        Failed to load analytics
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: summary.totalUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      data: timeSeriesData.newUsers,
      chartColor: '#3b82f6',
    },
    {
      title: 'New Users',
      value: summary.newUsersToday,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      data: timeSeriesData.newUsers,
      chartColor: '#10b981',
    },
    {
      title: 'Active Users',
      value: summary.activeUsersToday,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      data: timeSeriesData.activeUsers,
      chartColor: '#a855f7',
    },
    {
      title: 'Total Goals',
      value: summary.totalGoals,
      icon: Target,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      data: timeSeriesData.goals,
      chartColor: '#f97316',
    },
    {
      title: 'Total Habits',
      value: summary.totalHabits,
      icon: CheckSquare,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
      data: timeSeriesData.habits,
      chartColor: '#06b6d4',
    },
    {
      title: 'Total Notes',
      value: summary.totalNotes,
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      data: timeSeriesData.notes,
      chartColor: '#6366f1',
    },
    {
      title: 'Total Feedback',
      value: summary.totalFeedback,
      icon: MessageSquare,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      data: timeSeriesData.feedback,
      chartColor: '#ec4899',
    },
    {
      title: 'Unresolved Feedback',
      value: summary.unresolvedFeedback,
      icon: MessageSquare,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      data: timeSeriesData.feedback,
      chartColor: '#ef4444',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Overview
        </h2>
        <TimePeriodToggle selected={timePeriod} onChange={setTimePeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <AnalyticCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  )
}
