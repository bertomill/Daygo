import { supabase } from '../supabase'

export type TimePeriod = 'day' | 'week' | 'month' | 'year'

export interface TimeSeriesDataPoint {
  date: string
  value: number
}

export interface AnalyticsSummary {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  activeUsersToday: number
  activeUsersThisWeek: number
  totalGoals: number
  totalHabits: number
  totalNotes: number
  totalFeedback: number
  unresolvedFeedback: number
}

export interface TimeSeriesData {
  newUsers: TimeSeriesDataPoint[]
  activeUsers: TimeSeriesDataPoint[]
  goals: TimeSeriesDataPoint[]
  habits: TimeSeriesDataPoint[]
  notes: TimeSeriesDataPoint[]
  feedback: TimeSeriesDataPoint[]
}

function getDateRangeForPeriod(period: TimePeriod): { start: Date; intervals: number; format: string } {
  const now = new Date()
  const start = new Date()

  switch (period) {
    case 'day':
      start.setDate(start.getDate() - 30) // Last 30 days
      return { start, intervals: 30, format: 'MMM dd' }
    case 'week':
      start.setDate(start.getDate() - 12 * 7) // Last 12 weeks
      return { start, intervals: 12, format: 'MMM dd' }
    case 'month':
      start.setMonth(start.getMonth() - 12) // Last 12 months
      return { start, intervals: 12, format: 'MMM yyyy' }
    case 'year':
      start.setFullYear(start.getFullYear() - 5) // Last 5 years
      return { start, intervals: 5, format: 'yyyy' }
  }
}

function formatDate(date: Date, period: TimePeriod): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  switch (period) {
    case 'day':
      return `${months[date.getMonth()]} ${date.getDate()}`
    case 'week':
      return `${months[date.getMonth()]} ${date.getDate()}`
    case 'month':
      return `${months[date.getMonth()]} ${date.getFullYear()}`
    case 'year':
      return `${date.getFullYear()}`
  }
}

function getIntervalDates(period: TimePeriod): Date[] {
  const { start, intervals } = getDateRangeForPeriod(period)
  const dates: Date[] = []

  for (let i = 0; i <= intervals; i++) {
    const date = new Date(start)

    switch (period) {
      case 'day':
        date.setDate(start.getDate() + i)
        break
      case 'week':
        date.setDate(start.getDate() + i * 7)
        break
      case 'month':
        date.setMonth(start.getMonth() + i)
        break
      case 'year':
        date.setFullYear(start.getFullYear() + i)
        break
    }

    dates.push(date)
  }

  return dates
}

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get total users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalUsers } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get new users today
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: newUsersToday } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())

    // Get new users this week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: newUsersThisWeek } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())

    // Get new users this month
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: newUsersThisMonth } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString())

    // Get active users today (users who logged habits today)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeToday } = await (supabase as any)
      .from('habit_logs')
      .select('user_id')
      .gte('created_at', todayStart.toISOString())

    const activeUsersToday = new Set(activeToday?.map((log: { user_id: string }) => log.user_id) || []).size

    // Get active users this week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeWeek } = await (supabase as any)
      .from('habit_logs')
      .select('user_id')
      .gte('created_at', weekStart.toISOString())

    const activeUsersThisWeek = new Set(activeWeek?.map((log: { user_id: string }) => log.user_id) || []).size

    // Get total goals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalGoals } = await (supabase as any)
      .from('goals')
      .select('*', { count: 'exact', head: true })

    // Get total habits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalHabits } = await (supabase as any)
      .from('habits')
      .select('*', { count: 'exact', head: true })

    // Get total notes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalNotes } = await (supabase as any)
      .from('notes')
      .select('*', { count: 'exact', head: true })

    // Get feedback stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalFeedback } = await (supabase as any)
      .from('feedback')
      .select('*', { count: 'exact', head: true })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: unresolvedFeedback } = await (supabase as any)
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)

    return {
      totalUsers: totalUsers || 0,
      newUsersToday: newUsersToday || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      activeUsersToday,
      activeUsersThisWeek,
      totalGoals: totalGoals || 0,
      totalHabits: totalHabits || 0,
      totalNotes: totalNotes || 0,
      totalFeedback: totalFeedback || 0,
      unresolvedFeedback: unresolvedFeedback || 0,
    }
  },

  async getTimeSeriesData(period: TimePeriod): Promise<TimeSeriesData> {
    const dates = getIntervalDates(period)
    const { start } = getDateRangeForPeriod(period)

    // Fetch all data for the period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('created_at')
      .gte('created_at', start.toISOString())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: habitLogs } = await (supabase as any)
      .from('habit_logs')
      .select('created_at, user_id')
      .gte('created_at', start.toISOString())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: goals } = await (supabase as any)
      .from('goals')
      .select('created_at')
      .gte('created_at', start.toISOString())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: habits } = await (supabase as any)
      .from('habits')
      .select('created_at')
      .gte('created_at', start.toISOString())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notes } = await (supabase as any)
      .from('notes')
      .select('created_at')
      .gte('created_at', start.toISOString())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedback } = await (supabase as any)
      .from('feedback')
      .select('created_at')
      .gte('created_at', start.toISOString())

    // Process data into time series
    const newUsers: TimeSeriesDataPoint[] = []
    const activeUsers: TimeSeriesDataPoint[] = []
    const goalsData: TimeSeriesDataPoint[] = []
    const habitsData: TimeSeriesDataPoint[] = []
    const notesData: TimeSeriesDataPoint[] = []
    const feedbackData: TimeSeriesDataPoint[] = []

    for (let i = 0; i < dates.length - 1; i++) {
      const startDate = dates[i]
      const endDate = dates[i + 1]
      const label = formatDate(startDate, period)

      // Count new users
      const newUserCount = profiles?.filter((p: { created_at: string }) => {
        const date = new Date(p.created_at)
        return date >= startDate && date < endDate
      }).length || 0
      newUsers.push({ date: label, value: newUserCount })

      // Count active users (unique users who logged habits)
      const activeUserIds = new Set(
        habitLogs?.filter((log: { created_at: string }) => {
          const date = new Date(log.created_at)
          return date >= startDate && date < endDate
        }).map((log: { user_id: string }) => log.user_id) || []
      )
      activeUsers.push({ date: label, value: activeUserIds.size })

      // Count goals
      const goalCount = goals?.filter((g: { created_at: string }) => {
        const date = new Date(g.created_at)
        return date >= startDate && date < endDate
      }).length || 0
      goalsData.push({ date: label, value: goalCount })

      // Count habits
      const habitCount = habits?.filter((h: { created_at: string }) => {
        const date = new Date(h.created_at)
        return date >= startDate && date < endDate
      }).length || 0
      habitsData.push({ date: label, value: habitCount })

      // Count notes
      const noteCount = notes?.filter((n: { created_at: string }) => {
        const date = new Date(n.created_at)
        return date >= startDate && date < endDate
      }).length || 0
      notesData.push({ date: label, value: noteCount })

      // Count feedback
      const feedbackCount = feedback?.filter((f: { created_at: string }) => {
        const date = new Date(f.created_at)
        return date >= startDate && date < endDate
      }).length || 0
      feedbackData.push({ date: label, value: feedbackCount })
    }

    return {
      newUsers,
      activeUsers,
      goals: goalsData,
      habits: habitsData,
      notes: notesData,
      feedback: feedbackData,
    }
  },
}
