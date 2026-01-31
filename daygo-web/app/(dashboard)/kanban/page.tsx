'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { kanbanService } from '@/lib/services/kanban'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { KanbanStats } from '@/components/kanban/KanbanStats'
import { CreateColumnModal } from '@/components/kanban/CreateColumnModal'
import { EditColumnModal } from '@/components/kanban/EditColumnModal'
import { KanbanCardModal } from '@/components/kanban/KanbanCardModal'
import type {
  KanbanColumnWithCards,
  KanbanCardWithDetails,
} from '@/lib/types/database'

type TabView = 'board' | 'stats'

export default function KanbanPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabView>('board')

  // Modal states
  const [showCreateColumn, setShowCreateColumn] = useState(false)
  const [showEditColumn, setShowEditColumn] = useState(false)
  const [selectedColumn, setSelectedColumn] =
    useState<KanbanColumnWithCards | null>(null)
  const [showCardDetail, setShowCardDetail] = useState(false)
  const [selectedCard, setSelectedCard] =
    useState<KanbanCardWithDetails | null>(null)

  // Fetch columns with cards
  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['kanban-columns', user?.id],
    queryFn: () => kanbanService.getColumnsWithCards(user!.id),
    enabled: !!user,
  })

  // Mutation to update card status on drag
  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, status, columnId }: {
      cardId: string;
      status: 'todo' | 'in_progress' | 'done';
      columnId: string;
    }) => {
      return kanbanService.updateCard(cardId, { status, column_id: columnId })
    },
    onMutate: async ({ cardId, status, columnId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['kanban-columns', user?.id] })

      // Snapshot the previous value
      const previousColumns = queryClient.getQueryData(['kanban-columns', user?.id])

      // Optimistically update the cache
      queryClient.setQueryData(['kanban-columns', user?.id], (old: any) => {
        if (!old) return old

        return old.map((col: any) => {
          const allCards = [...col.todoCards, ...col.inProgressCards, ...col.doneCards]
          const updatedCards = allCards.map((card: any) => {
            if (card.id === cardId) {
              return { ...card, status, column_id: columnId }
            }
            return card
          })

          return {
            ...col,
            todoCards: updatedCards.filter((c: any) => c.column_id === col.id && c.status === 'todo'),
            inProgressCards: updatedCards.filter((c: any) => c.column_id === col.id && c.status === 'in_progress'),
            doneCards: updatedCards.filter((c: any) => c.column_id === col.id && c.status === 'done'),
          }
        })
      })

      return { previousColumns }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error and refetch
      queryClient.setQueryData(['kanban-columns', user?.id], context?.previousColumns)
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', user?.id] })
    },
  })

  // Mutation to reorder cards within a section
  const reorderCardsMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      return kanbanService.reorderCards(cardIds)
    },
    onError: () => {
      // Only refetch on error to restore correct order
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', user?.id] })
    },
  })

  // Mutation to reorder columns with optimistic update
  const reorderColumnsMutation = useMutation({
    mutationFn: async (columnIds: string[]) => {
      return kanbanService.reorderColumns(columnIds)
    },
    onMutate: async (columnIds) => {
      await queryClient.cancelQueries({ queryKey: ['kanban-columns', user?.id] })
      const previousColumns = queryClient.getQueryData(['kanban-columns', user?.id])

      // Optimistically reorder columns
      queryClient.setQueryData(['kanban-columns', user?.id], (old: KanbanColumnWithCards[] | undefined) => {
        if (!old) return old
        // Reorder based on the new columnIds order
        return columnIds.map(id => old.find(col => col.id === id)).filter(Boolean) as KanbanColumnWithCards[]
      })

      return { previousColumns }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error and refetch
      queryClient.setQueryData(['kanban-columns', user?.id], context?.previousColumns)
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', user?.id] })
    },
  })

  // Mutation to update card priority with optimistic update
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ cardId, priority }: { cardId: string; priority: number | null }) => {
      return kanbanService.updateCard(cardId, { priority })
    },
    onMutate: async ({ cardId, priority }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban-columns', user?.id] })
      const previousColumns = queryClient.getQueryData(['kanban-columns', user?.id])

      // Optimistically update priority
      queryClient.setQueryData(['kanban-columns', user?.id], (old: KanbanColumnWithCards[] | undefined) => {
        if (!old) return old
        return old.map((col) => ({
          ...col,
          todoCards: col.todoCards.map((card) =>
            card.id === cardId ? { ...card, priority } : card
          ),
          inProgressCards: col.inProgressCards.map((card) =>
            card.id === cardId ? { ...card, priority } : card
          ),
          doneCards: col.doneCards.map((card) =>
            card.id === cardId ? { ...card, priority } : card
          ),
        }))
      })

      return { previousColumns }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error and refetch
      queryClient.setQueryData(['kanban-columns', user?.id], context?.previousColumns)
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', user?.id] })
    },
  })

  // Mutation for timer start/stop with optimistic update
  const timerMutation = useMutation({
    mutationFn: async ({ cardId, isActive, timerId }: { cardId: string; isActive: boolean; timerId?: string }) => {
      if (isActive && timerId) {
        // Stop the timer
        return kanbanService.stopTimer(timerId)
      } else {
        // Start the timer
        return kanbanService.startTimer(user!.id, cardId)
      }
    },
    onMutate: async ({ cardId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban-columns', user?.id] })
      const previousColumns = queryClient.getQueryData(['kanban-columns', user?.id])

      // Optimistically toggle timer state
      queryClient.setQueryData(['kanban-columns', user?.id], (old: KanbanColumnWithCards[] | undefined) => {
        if (!old) return old
        return old.map((col) => ({
          ...col,
          todoCards: col.todoCards.map((card) =>
            card.id === cardId
              ? { ...card, activeTimer: isActive ? null : { id: 'temp', start_time: new Date().toISOString() } }
              : card
          ),
          inProgressCards: col.inProgressCards.map((card) =>
            card.id === cardId
              ? { ...card, activeTimer: isActive ? null : { id: 'temp', start_time: new Date().toISOString() } }
              : card
          ),
          doneCards: col.doneCards.map((card) =>
            card.id === cardId
              ? { ...card, activeTimer: isActive ? null : { id: 'temp', start_time: new Date().toISOString() } }
              : card
          ),
        }))
      })

      return { previousColumns }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error and refetch
      queryClient.setQueryData(['kanban-columns', user?.id], context?.previousColumns)
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', user?.id] })
    },
    // On success, fetch fresh data to get actual timer ID
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', user?.id] })
    },
  })

  const handleCardClick = (card: KanbanCardWithDetails) => {
    setSelectedCard(card)
    setShowCardDetail(true)
  }

  const handleEditColumn = (column: KanbanColumnWithCards) => {
    setSelectedColumn(column)
    setShowEditColumn(true)
  }

  const handleCardDrop = (
    cardId: string,
    newStatus: 'todo' | 'in_progress' | 'done',
    newColumnId: string
  ) => {
    updateCardMutation.mutate({ cardId, status: newStatus, columnId: newColumnId })
  }

  const handleCardReorder = (cardIds: string[]) => {
    reorderCardsMutation.mutate(cardIds)
  }

  const handleColumnReorder = (columnIds: string[]) => {
    reorderColumnsMutation.mutate(columnIds)
  }

  const handlePriorityChange = (cardId: string, priority: number | null) => {
    // Priority is limited to 1, 2, 3 (or null to clear)
    // The card picker component handles showing which are available
    if (priority !== null && (priority < 1 || priority > 3)) {
      return // Ignore invalid priorities
    }

    // Find which column the card belongs to
    const cardColumn = columns.find(col =>
      [...col.todoCards, ...col.inProgressCards, ...col.doneCards].some(c => c.id === cardId)
    )

    // If setting a priority, check if it's already in use by another card in the same column
    if (priority !== null && cardColumn) {
      const columnCards = [...cardColumn.todoCards, ...cardColumn.inProgressCards, ...cardColumn.doneCards]
      const cardWithPriority = columnCards.find(c => c.priority === priority && c.id !== cardId)
      if (cardWithPriority) {
        // Clear the priority from the other card first
        updatePriorityMutation.mutate({ cardId: cardWithPriority.id, priority: null })
      }
    }

    updatePriorityMutation.mutate({ cardId, priority })
  }

  const handleTimerToggle = (cardId: string, isActive: boolean) => {
    // Find the card to get the active timer ID
    const card = columns
      .flatMap(col => [...col.todoCards, ...col.inProgressCards, ...col.doneCards])
      .find(c => c.id === cardId)

    timerMutation.mutate({
      cardId,
      isActive,
      timerId: card?.activeTimer?.id,
    })
  }

  const handleComplete = (cardId: string, isDone: boolean) => {
    // Toggle between done and todo status
    const newStatus = isDone ? 'todo' : 'done'
    updateCardMutation.mutate({ cardId, status: newStatus, columnId: columns.flatMap(col => [...col.todoCards, ...col.inProgressCards, ...col.doneCards]).find(c => c.id === cardId)?.column_id || '' })
  }

  // Empty state when no columns
  if (!isLoading && columns.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 min-h-screen bg-bevel-bg dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-bevel-text dark:text-white mb-6">
          Contribution Board
        </h1>
        <div className="text-center py-16 px-6">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-bevel-text dark:text-white mb-2">
            Get organized
          </h3>
          <p className="text-bevel-text-secondary dark:text-slate-400 mb-6 leading-relaxed">
            Create your first column to start organizing your tasks and projects!
          </p>
          <button
            onClick={() => setShowCreateColumn(true)}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-bevel-sm hover:shadow-bevel"
          >
            Create Column
          </button>
        </div>

        {showCreateColumn && (
          <CreateColumnModal onClose={() => setShowCreateColumn(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white pl-12 mb-3">
          Contribution
        </h1>

        {/* Tab Buttons */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1 w-fit ml-12">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'board'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        </div>
      </div>

      {activeTab === 'board' ? (
        isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-500 dark:text-slate-400">
              Loading...
            </div>
          </div>
        ) : (
          <KanbanBoard
            columns={columns}
            onCardClick={handleCardClick}
            onAddColumn={() => setShowCreateColumn(true)}
            onEditColumn={handleEditColumn}
            onCardDrop={handleCardDrop}
            onCardReorder={handleCardReorder}
            onColumnReorder={handleColumnReorder}
            onPriorityChange={handlePriorityChange}
            onTimerToggle={handleTimerToggle}
            onComplete={handleComplete}
          />
        )
      ) : (
        <div className="flex-1 overflow-y-auto bg-bevel-bg dark:bg-slate-900">
          <KanbanStats />
        </div>
      )}

      {/* Modals */}
      {showCreateColumn && (
        <CreateColumnModal onClose={() => setShowCreateColumn(false)} />
      )}

      {showEditColumn && selectedColumn && (
        <EditColumnModal
          column={selectedColumn}
          onClose={() => setShowEditColumn(false)}
        />
      )}

      {showCardDetail && selectedCard && (
        <KanbanCardModal
          card={selectedCard}
          onClose={() => setShowCardDetail(false)}
        />
      )}
    </div>
  )
}
