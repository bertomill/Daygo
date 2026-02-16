import { supabase } from '../supabase'
import type { GiftIdea } from '../types/database'

export const giftIdeasService = {
  async getGiftIdeas(userId: string, recipient = 'Katie'): Promise<GiftIdea[]> {
    const { data, error } = await (supabase
      .from('gift_ideas') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('recipient', recipient)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as GiftIdea[]) ?? []
  },

  async addGiftIdea(userId: string, idea: string, recipient = 'Katie'): Promise<GiftIdea> {
    const { data, error } = await (supabase
      .from('gift_ideas') as any)
      .insert({ user_id: userId, idea, recipient })
      .select()
      .single()

    if (error) throw error
    return data as GiftIdea
  },

  async toggleUsed(id: string, used: boolean): Promise<GiftIdea> {
    const { data, error } = await (supabase
      .from('gift_ideas') as any)
      .update({ used })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as GiftIdea
  },

  async deleteGiftIdea(id: string): Promise<void> {
    const { error } = await (supabase
      .from('gift_ideas') as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
