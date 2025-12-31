import { supabase } from '../supabase'
import type {
  KanbanColumn,
  KanbanCard,
  KanbanSubtask,
  KanbanColumnWithCards,
  KanbanCardWithDetails,
  KanbanTimeEntry,
  Goal,
} from '../types/database'

export const kanbanService = {
  // ============ COLUMNS ============

  async getColumns(userId: string): Promise<KanbanColumn[]> {
    const { data, error } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as KanbanColumn[]) ?? []
  },

  async getColumnsWithCards(
    userId: string
  ): Promise<KanbanColumnWithCards[]> {
    const { data: columns, error: columnsError } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (columnsError) throw columnsError

    const { data: cards, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (cardsError) throw cardsError

    const { data: subtasks, error: subtasksError } = await supabase
      .from('kanban_subtasks')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (subtasksError) throw subtasksError

    const { data: links, error: linksError } = await supabase
      .from('kanban_goal_links')
      .select('card_id, goal_id')

    if (linksError) throw linksError

    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)

    if (goalsError) throw goalsError

    const { data: timeEntries, error: timeEntriesError } = await supabase
      .from('kanban_time_entries')
      .select('*')
      .eq('user_id', userId)

    if (timeEntriesError) throw timeEntriesError

    const typedColumns = (columns as KanbanColumn[]) ?? []
    const typedCards = (cards as KanbanCard[]) ?? []
    const typedSubtasks = (subtasks as KanbanSubtask[]) ?? []
    const typedLinks =
      (links as { card_id: string; goal_id: string }[]) ?? []
    const typedGoals = (goals as Goal[]) ?? []
    const typedTimeEntries = (timeEntries as KanbanTimeEntry[]) ?? []

    return typedColumns.map((column) => {
      const columnCards = typedCards.filter((c) => c.column_id === column.id)

      const enrichCard = (card: KanbanCard): KanbanCardWithDetails => {
        const cardSubtasks = typedSubtasks.filter(
          (s) => s.card_id === card.id
        )
        const goalLink = typedLinks.find((l) => l.card_id === card.id)
        const goal = goalLink
          ? typedGoals.find((g) => g.id === goalLink.goal_id) ?? null
          : null

        const cardTimeEntries = typedTimeEntries.filter(
          (t) => t.card_id === card.id
        )
        const activeTimer = cardTimeEntries.find((t) => !t.end_time) ?? null

        const totalTimeSpent = cardTimeEntries.reduce((total, entry) => {
          if (!entry.end_time) return total
          const start = new Date(entry.start_time).getTime()
          const end = new Date(entry.end_time).getTime()
          return total + (end - start)
        }, 0)

        return {
          ...card,
          subtasks: cardSubtasks,
          goal,
          column,
          timeEntries: cardTimeEntries,
          activeTimer,
          totalTimeSpent,
        }
      }

      return {
        ...column,
        todoCards: columnCards
          .filter((c) => c.status === 'todo')
          .map(enrichCard),
        inProgressCards: columnCards
          .filter((c) => c.status === 'in_progress')
          .map(enrichCard),
        doneCards: columnCards
          .filter((c) => c.status === 'done')
          .map(enrichCard),
      }
    })
  },

  async createColumn(
    userId: string,
    title: string,
    description: string = '',
    color: string = '#3b82f6'
  ): Promise<KanbanColumn> {
    const { data, error } = await supabase
      .from('kanban_columns')
      .insert({
        user_id: userId,
        title,
        description,
        color,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as KanbanColumn
  },

  async updateColumn(
    columnId: string,
    title: string,
    description: string,
    color: string
  ): Promise<KanbanColumn> {
    const { data, error } = await (supabase.from('kanban_columns') as any)
      .update({ title, description, color })
      .eq('id', columnId)
      .select()
      .single()

    if (error) throw error
    return data as KanbanColumn
  },

  async deleteColumn(columnId: string): Promise<void> {
    const { error } = await supabase
      .from('kanban_columns')
      .delete()
      .eq('id', columnId)

    if (error) throw error
  },

  async reorderColumns(orderedIds: string[]): Promise<void> {
    // Update all columns in parallel for better performance
    await Promise.all(
      orderedIds.map((id, index) =>
        (supabase.from('kanban_columns') as any)
          .update({ sort_order: index })
          .eq('id', id)
      )
    )
  },

  // ============ CARDS ============

  async getCard(cardId: string): Promise<KanbanCardWithDetails | null> {
    const { data: card, error: cardError } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (cardError) return null

    const { data: subtasks } = await supabase
      .from('kanban_subtasks')
      .select('*')
      .eq('card_id', cardId)
      .order('sort_order', { ascending: true })

    const { data: link } = await supabase
      .from('kanban_goal_links')
      .select('goal_id')
      .eq('card_id', cardId)
      .single()

    const typedLink = link as { goal_id: string } | null

    let goal: Goal | null = null
    if (typedLink) {
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('id', typedLink.goal_id)
        .single()
      goal = (goalData as Goal | null) ?? null
    }

    const { data: column } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('id', (card as KanbanCard).column_id)
      .single()

    return {
      ...(card as KanbanCard),
      subtasks: (subtasks as KanbanSubtask[]) ?? [],
      goal,
      column: (column as KanbanColumn | null) ?? ({} as KanbanColumn),
    }
  },

  async createCard(
    userId: string,
    columnId: string,
    title: string,
    description: string = '',
    goalId: string | null = null
  ): Promise<KanbanCard> {
    const { data, error } = await supabase
      .from('kanban_cards')
      .insert({
        user_id: userId,
        column_id: columnId,
        title,
        description,
        status: 'todo',
      } as any)
      .select()
      .single()

    if (error) throw error

    const card = data as KanbanCard

    // Link to goal if provided
    if (goalId) {
      await supabase.from('kanban_goal_links').insert({
        card_id: card.id,
        goal_id: goalId,
      } as any)
    }

    return card
  },

  async updateCard(
    cardId: string,
    updates: {
      title?: string
      description?: string
      column_id?: string
      status?: 'todo' | 'in_progress' | 'done'
      tags?: string[]
      high_priority?: boolean
      priority?: number | null
    }
  ): Promise<KanbanCard> {
    const { data, error } = await (supabase.from('kanban_cards') as any)
      .update(updates)
      .eq('id', cardId)
      .select()
      .single()

    if (error) throw error
    return data as KanbanCard
  },

  async deleteCard(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', cardId)

    if (error) throw error
  },

  async moveCard(
    cardId: string,
    newColumnId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ): Promise<KanbanCard> {
    const { data, error } = await (supabase.from('kanban_cards') as any)
      .update({
        column_id: newColumnId,
        status: newStatus,
      })
      .eq('id', cardId)
      .select()
      .single()

    if (error) throw error
    return data as KanbanCard
  },

  async reorderCards(orderedIds: string[]): Promise<void> {
    // Update all cards in parallel for better performance
    await Promise.all(
      orderedIds.map((id, index) =>
        (supabase.from('kanban_cards') as any)
          .update({ sort_order: index })
          .eq('id', id)
      )
    )
  },

  // ============ SUBTASKS ============

  async createSubtask(
    userId: string,
    cardId: string,
    text: string
  ): Promise<KanbanSubtask> {
    const { data, error } = await supabase
      .from('kanban_subtasks')
      .insert({
        user_id: userId,
        card_id: cardId,
        text,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as KanbanSubtask
  },

  async toggleSubtask(
    subtaskId: string,
    completed: boolean
  ): Promise<KanbanSubtask> {
    const { data, error } = await (supabase.from('kanban_subtasks') as any)
      .update({ completed })
      .eq('id', subtaskId)
      .select()
      .single()

    if (error) throw error
    return data as KanbanSubtask
  },

  async deleteSubtask(subtaskId: string): Promise<void> {
    const { error } = await supabase
      .from('kanban_subtasks')
      .delete()
      .eq('id', subtaskId)

    if (error) throw error
  },

  // ============ GOAL LINKS ============

  async linkGoal(cardId: string, goalId: string): Promise<void> {
    const { error } = await supabase.from('kanban_goal_links').insert({
      card_id: cardId,
      goal_id: goalId,
    } as any)

    if (error) throw error
  },

  async unlinkGoal(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('kanban_goal_links')
      .delete()
      .eq('card_id', cardId)

    if (error) throw error
  },

  // ============ TIME TRACKING ============

  async startTimer(userId: string, cardId: string): Promise<KanbanTimeEntry> {
    // First, stop any active timers for this user
    const { data: activeTimers } = await supabase
      .from('kanban_time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)

    const typedActiveTimers = (activeTimers as KanbanTimeEntry[]) ?? []

    if (typedActiveTimers.length > 0) {
      for (const timer of typedActiveTimers) {
        await (supabase.from('kanban_time_entries') as any)
          .update({ end_time: new Date().toISOString() })
          .eq('id', timer.id)
      }
    }

    // Start new timer
    const { data, error } = await supabase
      .from('kanban_time_entries')
      .insert({
        user_id: userId,
        card_id: cardId,
        start_time: new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as KanbanTimeEntry
  },

  async stopTimer(entryId: string): Promise<KanbanTimeEntry> {
    const { data, error } = await (supabase.from('kanban_time_entries') as any)
      .update({ end_time: new Date().toISOString() })
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error
    return data as KanbanTimeEntry
  },

  async getActiveTimer(userId: string): Promise<KanbanTimeEntry | null> {
    const { data, error } = await supabase
      .from('kanban_time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data as KanbanTimeEntry
  },

  async getCardTimeEntries(cardId: string): Promise<KanbanTimeEntry[]> {
    const { data, error } = await supabase
      .from('kanban_time_entries')
      .select('*')
      .eq('card_id', cardId)
      .order('start_time', { ascending: false })

    if (error) throw error
    return (data as KanbanTimeEntry[]) ?? []
  },

  async getTotalTimeSpent(cardId: string): Promise<number> {
    const entries = await this.getCardTimeEntries(cardId)

    return entries.reduce((total, entry) => {
      if (!entry.end_time) return total // Skip active timers

      const start = new Date(entry.start_time).getTime()
      const end = new Date(entry.end_time).getTime()
      return total + (end - start)
    }, 0)
  },
}
