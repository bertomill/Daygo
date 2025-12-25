import { supabase } from '../supabase'
import type { JournalPrompt, JournalEntry, JournalPromptWithEntry } from '../types/database'

export const journalService = {
  async getPrompts(userId: string): Promise<JournalPrompt[]> {
    const { data, error } = await supabase
      .from('journal_prompts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as JournalPrompt[]) ?? []
  },

  async getPromptsWithEntries(userId: string, date: string): Promise<JournalPromptWithEntry[]> {
    const { data: prompts, error: promptsError } = await supabase
      .from('journal_prompts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (promptsError) throw promptsError

    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)

    if (entriesError) throw entriesError

    const typedPrompts = prompts as JournalPrompt[] ?? []
    const typedEntries = entries as JournalEntry[] ?? []
    const entriesMap = new Map(typedEntries.map((e) => [e.prompt_id, e]))

    return typedPrompts.map((prompt) => ({
      ...prompt,
      todayEntry: entriesMap.get(prompt.id)?.entry ?? null,
    }))
  },

  async createPrompt(userId: string, prompt: string): Promise<JournalPrompt> {
    const { data, error } = await supabase
      .from('journal_prompts')
      .insert({
        user_id: userId,
        prompt,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as JournalPrompt
  },

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
      .single()

    if (error) throw error
    return data as JournalEntry
  },

  async updatePrompt(id: string, prompt: string): Promise<JournalPrompt> {
    const { data, error } = await (supabase
      .from('journal_prompts') as any)
      .update({ prompt })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as JournalPrompt
  },

  async deletePrompt(id: string): Promise<void> {
    const { error } = await (supabase
      .from('journal_prompts') as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },
}
