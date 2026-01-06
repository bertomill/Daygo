import { supabase } from '../supabase'
import type { Mantra } from '../types/database'

export const mantrasService = {
  async getMantras(userId: string): Promise<Mantra[]> {
    const { data, error } = await supabase
      .from('mantras')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Mantra[]) ?? []
  },

  async createMantra(userId: string, text: string): Promise<Mantra> {
    const { data, error } = await supabase
      .from('mantras')
      .insert({
        user_id: userId,
        text,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Mantra
  },

  async updateMantra(id: string, text: string): Promise<Mantra> {
    const { data, error } = await (supabase
      .from('mantras') as any)
      .update({ text })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Mantra
  },

  async deleteMantra(id: string): Promise<void> {
    const { error } = await (supabase
      .from('mantras') as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  async reorderMantras(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await (supabase
        .from('mantras') as any)
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
      if (error) throw error
    }
  },
}
