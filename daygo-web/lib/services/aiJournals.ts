import { supabase } from '../supabase'
import type { AIJournal } from '../types/database'

export const aiJournalsService = {
  // Get all AI journal prompts for a user (unique prompts)
  async getAIJournalPrompts(userId: string): Promise<AIJournal[]> {
    // Get distinct prompts (most recent entry for each prompt)
    const { data, error } = await supabase
      .from('ai_journals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Dedupe by prompt, keeping the most recent
    const promptMap = new Map<string, AIJournal>()
    for (const journal of (data as AIJournal[]) ?? []) {
      if (!promptMap.has(journal.prompt)) {
        promptMap.set(journal.prompt, journal)
      }
    }

    return Array.from(promptMap.values())
  },

  // Get AI journals for a specific date (with responses)
  async getAIJournalsForDate(userId: string, date: string): Promise<AIJournal[]> {
    const { data, error } = await supabase
      .from('ai_journals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as AIJournal[]) ?? []
  },

  // Create a new AI journal prompt (initially without response)
  async createAIJournalPrompt(userId: string, prompt: string, date: string): Promise<AIJournal> {
    const { data, error } = await supabase
      .from('ai_journals')
      .insert({
        user_id: userId,
        prompt,
        date,
        response: null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as AIJournal
  },

  // Update the response for an AI journal
  async updateResponse(id: string, response: string): Promise<AIJournal> {
    const { data, error } = await (supabase
      .from('ai_journals') as any)
      .update({ response })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as AIJournal
  },

  // Get or create an AI journal entry for a specific prompt and date
  async getOrCreateForDate(userId: string, prompt: string, date: string): Promise<AIJournal> {
    // First try to find existing entry for this prompt+date
    const { data: existing } = await supabase
      .from('ai_journals')
      .select('*')
      .eq('user_id', userId)
      .eq('prompt', prompt)
      .eq('date', date)
      .eq('is_active', true)
      .single()

    if (existing) {
      return existing as AIJournal
    }

    // Create new entry for today
    const { data, error } = await supabase
      .from('ai_journals')
      .insert({
        user_id: userId,
        prompt,
        date,
        response: null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as AIJournal
  },

  // Delete an AI journal (soft delete)
  async deleteAIJournal(id: string): Promise<void> {
    const { error } = await (supabase
      .from('ai_journals') as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  // Delete all entries for a prompt (when deleting the prompt itself)
  async deletePrompt(userId: string, prompt: string): Promise<void> {
    const { error } = await (supabase
      .from('ai_journals') as any)
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('prompt', prompt)

    if (error) throw error
  },
}
