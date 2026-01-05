import { supabase } from '../supabase'
import type { CalendarRule } from '../types/database'

export const calendarRulesService = {
  async getRules(userId: string): Promise<CalendarRule[]> {
    const { data, error } = await supabase
      .from('calendar_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })

    if (error) throw error
    return (data as CalendarRule[]) ?? []
  },

  async createRule(userId: string, ruleText: string): Promise<CalendarRule> {
    // Get the highest priority to add new rule at the end
    const { data: existing } = await supabase
      .from('calendar_rules')
      .select('priority')
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .limit(1)

    const nextPriority = existing && existing.length > 0 ? (existing[0] as { priority: number }).priority + 1 : 0

    const { data, error } = await supabase
      .from('calendar_rules')
      .insert({
        user_id: userId,
        rule_text: ruleText,
        priority: nextPriority,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as CalendarRule
  },

  async updateRule(
    ruleId: string,
    updates: { rule_text?: string; is_active?: boolean }
  ): Promise<CalendarRule> {
    const { data, error } = await (supabase
      .from('calendar_rules') as any)
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single()

    if (error) throw error
    return data as CalendarRule
  },

  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_rules')
      .delete()
      .eq('id', ruleId)

    if (error) throw error
  },

  async reorderRules(ruleIds: string[]): Promise<void> {
    const updates = ruleIds.map((id, index) => ({
      id,
      priority: index,
    }))

    for (const update of updates) {
      const { error } = await (supabase
        .from('calendar_rules') as any)
        .update({ priority: update.priority })
        .eq('id', update.id)

      if (error) throw error
    }
  },
}
