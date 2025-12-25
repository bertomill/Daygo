import { supabase } from '../supabase'
import type { Vision } from '../types/database'

export const visionsService = {
  async getVisions(userId: string): Promise<Vision[]> {
    const { data, error } = await supabase
      .from('visions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Vision[]) ?? []
  },

  async createVision(userId: string, text: string): Promise<Vision> {
    const { data, error } = await supabase
      .from('visions')
      .insert({
        user_id: userId,
        text,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Vision
  },

  async updateVision(id: string, text: string): Promise<Vision> {
    const { data, error } = await (supabase
      .from('visions') as any)
      .update({ text })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Vision
  },

  async deleteVision(id: string): Promise<void> {
    const { error } = await (supabase
      .from('visions') as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },
}
