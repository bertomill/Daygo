import { supabase } from './supabase';
import { Identity } from '../types/database';

export const identitiesService = {
  // Get all active identities for a user
  async getIdentities(userId: string): Promise<Identity[]> {
    const { data, error } = await supabase
      .from('identities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as Identity[]) ?? [];
  },

  // Create a new identity
  async createIdentity(userId: string, text: string): Promise<Identity> {
    const { data, error } = await supabase
      .from('identities')
      .insert({
        user_id: userId,
        text,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Identity;
  },

  // Update an identity
  async updateIdentity(id: string, text: string): Promise<Identity> {
    const { data, error } = await (supabase
      .from('identities') as any)
      .update({ text })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Identity;
  },

  // Delete (deactivate) an identity
  async deleteIdentity(id: string): Promise<void> {
    const { error } = await (supabase
      .from('identities') as any)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Update sort order for an identity
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    const { error } = await (supabase
      .from('identities') as any)
      .update({ sort_order: sortOrder })
      .eq('id', id);

    if (error) throw error;
  },

  // Batch update sort orders
  async reorderIdentities(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.updateSortOrder(orderedIds[i], i);
    }
  },
};
