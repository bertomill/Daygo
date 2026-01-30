import { supabase } from '../supabase'
import type { Identity } from '../types/database'

export const identitiesService = {
  async getIdentities(userId: string): Promise<Identity[]> {
    const { data, error } = await supabase
      .from('identities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Identity[]) ?? []
  },

  async createIdentity(userId: string, text: string): Promise<Identity> {
    const { data, error } = await supabase
      .from('identities')
      .insert({
        user_id: userId,
        text,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Identity
  },

  async updateIdentity(id: string, text: string): Promise<Identity> {
    const { data, error } = await (supabase
      .from('identities') as any)
      .update({ text })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Identity
  },

  async deleteIdentity(id: string): Promise<void> {
    const { error } = await (supabase
      .from('identities') as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  async reorderIdentities(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await (supabase
        .from('identities') as any)
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
      if (error) throw error
    }
  },
}
