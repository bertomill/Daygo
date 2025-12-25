import { supabase } from '../supabase'
import type { Todo } from '../types/database'

export const todosService = {
  async getTodos(userId: string, date: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Todo[]) ?? []
  },

  async createTodo(userId: string, text: string, date: string): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: userId,
        text,
        date,
        completed: false,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Todo
  },

  async toggleTodo(todoId: string, completed: boolean): Promise<Todo> {
    const { data, error } = await (supabase
      .from('todos') as any)
      .update({ completed })
      .eq('id', todoId)
      .select()
      .single()

    if (error) throw error
    return data as Todo
  },

  async deleteTodo(todoId: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)

    if (error) throw error
  },

  async reorderTodos(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await (supabase
        .from('todos') as any)
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
      if (error) throw error
    }
  },
}
