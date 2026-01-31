import { supabase } from '../supabase'
import type { Book } from '../types/database'

export const booksService = {
  async getCurrentlyReading(userId: string): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('is_reading', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Book[]) ?? []
  },

  async getCompletedBooks(userId: string): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('is_reading', false)
      .order('completed_at', { ascending: false })

    if (error) throw error
    return (data as Book[]) ?? []
  },

  async getCompletedBooksByYear(userId: string): Promise<Record<number, Book[]>> {
    const books = await this.getCompletedBooks(userId)

    const booksByYear: Record<number, Book[]> = {}
    for (const book of books) {
      const year = book.completed_at
        ? new Date(book.completed_at).getFullYear()
        : new Date().getFullYear()
      if (!booksByYear[year]) {
        booksByYear[year] = []
      }
      booksByYear[year].push(book)
    }

    return booksByYear
  },

  async createBook(userId: string, title: string, author?: string): Promise<Book> {
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        title,
        author: author || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Book
  },

  async updateBook(id: string, updates: Partial<Pick<Book, 'title' | 'author' | 'notes'>>): Promise<Book> {
    const { data, error } = await (supabase
      .from('books') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Book
  },

  async markAsCompleted(id: string): Promise<Book> {
    const { data, error } = await (supabase
      .from('books') as any)
      .update({
        is_reading: false,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Book
  },

  async markAsReading(id: string): Promise<Book> {
    const { data, error } = await (supabase
      .from('books') as any)
      .update({
        is_reading: true,
        completed_at: null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Book
  },

  async deleteBook(id: string): Promise<void> {
    const { error } = await (supabase
      .from('books') as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorderBooks(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await (supabase
        .from('books') as any)
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
      if (error) throw error
    }
  },
}
