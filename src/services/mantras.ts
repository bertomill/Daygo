import { supabase } from './supabase';
import { Mantra } from '../types/database';

export const mantrasService = {
  // Get all active mantras for a user
  async getMantras(userId: string): Promise<Mantra[]> {
    const { data, error } = await supabase
      .from('mantras')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as Mantra[]) ?? [];
  },

  // Create a new mantra
  async createMantra(userId: string, text: string): Promise<Mantra> {
    const { data, error } = await supabase
      .from('mantras')
      .insert({
        user_id: userId,
        text,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Mantra;
  },

  // Update a mantra
  async updateMantra(id: string, text: string): Promise<Mantra> {
    const { data, error } = await (supabase
      .from('mantras') as any)
      .update({ text })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Mantra;
  },

  // Delete (deactivate) a mantra
  async deleteMantra(id: string): Promise<void> {
    const { error } = await (supabase
      .from('mantras') as any)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Update sort order for a mantra
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    const { error } = await (supabase
      .from('mantras') as any)
      .update({ sort_order: sortOrder })
      .eq('id', id);

    if (error) throw error;
  },

  // Batch update sort orders
  async reorderMantras(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.updateSortOrder(orderedIds[i], i);
    }
  },
};
