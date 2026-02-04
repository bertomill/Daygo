import { supabase } from '../supabase'
import type { Value } from '../types/database'

export const valuesService = {
  async getValues(userId: string): Promise<Value[]> {
    const { data, error } = await supabase
      .from('values')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Value[]) ?? []
  },

  async createValue(userId: string, text: string): Promise<Value> {
    const { data, error } = await supabase
      .from('values')
      .insert({
        user_id: userId,
        text,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Value
  },

  async updateValue(id: string, text: string): Promise<Value> {
    const { data, error } = await (supabase
      .from('values') as any)
      .update({ text })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Value
  },

  async deleteValue(id: string): Promise<void> {
    const { error } = await (supabase
      .from('values') as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  async reorderValues(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await (supabase
        .from('values') as any)
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
      if (error) throw error
    }
  },
}
