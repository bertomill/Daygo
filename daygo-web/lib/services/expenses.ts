import { supabase } from '../supabase'
import type { Expense, ExpenseCategory } from '../types/database'

export const expensesService = {
  async getExpenses(userId: string, date: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as Expense[]) ?? []
  },

  async getMonthlyTotals(userId: string): Promise<{ month: string; total: number }[]> {
    // Get expenses from the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (error) throw error

    // Aggregate by month
    const monthMap = new Map<string, number>()
    for (const row of (data ?? []) as { amount: number; date: string }[]) {
      const month = row.date.substring(0, 7) // "YYYY-MM"
      monthMap.set(month, (monthMap.get(month) ?? 0) + Number(row.amount))
    }

    // Ensure all 6 months are present
    const result: { month: string; total: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      result.push({ month: key, total: monthMap.get(key) ?? 0 })
    }

    return result
  },

  async createExpense(
    userId: string,
    amount: number,
    category: ExpenseCategory,
    description: string | null,
    date: string
  ): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount,
        category,
        description,
        date,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await (supabase
      .from('expenses') as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },
}
