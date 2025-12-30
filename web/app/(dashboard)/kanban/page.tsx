'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { kanbanService } from '@/lib/services/kanban'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CreateColumnModal } from '@/components/kanban/CreateColumnModal'
import { EditColumnModal } from '@/components/kanban/EditColumnModal'
import { KanbanCardModal } from '@/components/kanban/KanbanCardModal'
import type {
  KanbanColumnWithCards,
  KanbanCardWithDetails,
} from '@/lib/types/database'

export default function KanbanPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
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

  // Empty state when no columns
  if (!isLoading && columns.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 min-h-screen bg-bevel-bg dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-bevel-text dark:text-white mb-6">
          Kanban Board
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kanban Board
        </h1>
      </div>

      {isLoading ? (
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
        />
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
