import { supabase } from '../supabase'
import type { Note } from '../types/database'

export const notesService = {
  async getNotes(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data as Note[]) ?? []
  },

  async getNote(noteId: string): Promise<Note | null> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Note
  },

  async createNote(userId: string, title: string, content: string = ''): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Note
  },

  async updateNote(noteId: string, updates: { title?: string; content?: string }): Promise<Note> {
    const { data, error } = await (supabase
      .from('notes') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as Note
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await (supabase
      .from('notes') as any)
      .delete()
      .eq('id', noteId)

    if (error) throw error
  },
}
