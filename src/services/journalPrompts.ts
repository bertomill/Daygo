import { supabase } from './supabase';
import { JournalPrompt, JournalEntry, JournalPromptWithEntry } from '../types/database';

export const journalPromptsService = {
  // Get all active journal prompts for a user
  async getPrompts(userId: string): Promise<JournalPrompt[]> {
    const { data, error } = await supabase
      .from('journal_prompts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as JournalPrompt[]) ?? [];
  },

  // Get prompts with today's entries
  async getPromptsWithEntries(userId: string, date: string): Promise<JournalPromptWithEntry[]> {
    const { data: prompts, error: promptsError } = await supabase
      .from('journal_prompts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (promptsError) throw promptsError;

    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    if (entriesError) throw entriesError;

    const typedPrompts = prompts as JournalPrompt[] ?? [];
    const typedEntries = entries as JournalEntry[] ?? [];
    const entriesMap = new Map(typedEntries.map((entry) => [entry.prompt_id, entry]));

    return typedPrompts.map((prompt) => ({
      ...prompt,
      todayEntry: entriesMap.get(prompt.id)?.entry ?? null,
    }));
  },

  // Create a new journal prompt
  async createPrompt(userId: string, prompt: string): Promise<JournalPrompt> {
    const { data, error } = await supabase
      .from('journal_prompts')
      .insert({
        user_id: userId,
        prompt,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as JournalPrompt;
  },

  // Update a journal prompt
  async updatePrompt(id: string, prompt: string): Promise<JournalPrompt> {
    const { data, error } = await (supabase
      .from('journal_prompts') as any)
      .update({ prompt })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as JournalPrompt;
  },

  // Delete (deactivate) a journal prompt
  async deletePrompt(id: string): Promise<void> {
    const { error } = await (supabase
      .from('journal_prompts') as any)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Save a journal entry
  async saveEntry(
    userId: string,
    promptId: string,
    entry: string,
    date: string
  ): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert(
        {
          user_id: userId,
          prompt_id: promptId,
          entry,
          date,
        } as any,
        {
          onConflict: 'prompt_id,date',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as JournalEntry;
  },

  // Get entry for a specific prompt and date
  async getEntry(promptId: string, date: string): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as JournalEntry | null;
  },

  // Update sort order for a prompt
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    const { error } = await (supabase
      .from('journal_prompts') as any)
      .update({ sort_order: sortOrder })
      .eq('id', id);

    if (error) throw error;
  },

  // Batch update sort orders
  async reorderPrompts(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.updateSortOrder(orderedIds[i], i);
    }
  },
};
