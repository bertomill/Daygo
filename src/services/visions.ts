import { supabase } from './supabase';
import { Vision } from '../types/database';

export const visionsService = {
  // Get all active visions for a user
  async getVisions(userId: string): Promise<Vision[]> {
    const { data, error } = await supabase
      .from('visions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as Vision[]) ?? [];
  },

  // Create a new vision
  async createVision(userId: string, text: string): Promise<Vision> {
    const { data, error } = await supabase
      .from('visions')
      .insert({
        user_id: userId,
        text,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Vision;
  },

  // Update a vision
  async updateVision(id: string, text: string): Promise<Vision> {
    const { data, error } = await (supabase
      .from('visions') as any)
      .update({ text })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Vision;
  },

  // Delete (deactivate) a vision
  async deleteVision(id: string): Promise<void> {
    const { error } = await (supabase
      .from('visions') as any)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Update sort order for a vision
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    const { error } = await (supabase
      .from('visions') as any)
      .update({ sort_order: sortOrder })
      .eq('id', id);

    if (error) throw error;
  },

  // Batch update sort orders
  async reorderVisions(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.updateSortOrder(orderedIds[i], i);
    }
  },
};
