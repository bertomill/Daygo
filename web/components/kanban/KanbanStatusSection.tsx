'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, X, Check } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import { useAuthStore } from '@/lib/auth-store'
import { kanbanService } from '@/lib/services/kanban'
import type { KanbanCardWithDetails } from '@/lib/types/database'

interface KanbanStatusSectionProps {
  status: 'todo' | 'in_progress' | 'done'
  columnId: string
  cards: KanbanCardWithDetails[]
  onCardClick: (card: KanbanCardWithDetails) => void
  onPriorityChange?: (cardId: string, priority: number | null) => void
  onTimerToggle?: (cardId: string, isActive: boolean) => void
  onComplete?: (cardId: string, isDone: boolean) => void
}

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const statusColors = {
  todo: 'text-gray-600 dark:text-gray-400',
  in_progress: 'text-blue-600 dark:text-blue-400',
  done: 'text-green-600 dark:text-green-400',
}

export function KanbanStatusSection({
  status,
  columnId,
  cards,
  onCardClick,
  onPriorityChange,
  onTimerToggle,
  onComplete,
}: KanbanStatusSectionProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')

  const dropId = `${columnId}-${status}`
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
  })

  const createCardMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user) return
      return kanbanService.createCard(user.id, columnId, title, '', null)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
      setNewCardTitle('')
      setIsAdding(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCardTitle.trim()) {
      createCardMutation.mutate(newCardTitle.trim())
    }
  }

  const handleCancel = () => {
    setNewCardTitle('')
    setIsAdding(false)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
          <span className={`font-medium text-sm ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          <span className="text-xs text-gray-400 dark:text-slate-500">
            ({cards.length})
          </span>
        </div>
      </button>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`space-y-2 ml-6 min-h-[100px] rounded-lg border-2 border-dashed transition-all p-2 ${
            isOver
              ? 'border-accent bg-accent/5 dark:bg-accent/10'
              : 'border-transparent'
          } ${cards.length === 0 ? 'bg-gray-50/50 dark:bg-slate-800/50' : ''}`}
        >
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {cards.length === 0 && !isAdding && (
              <div className="text-center py-4 text-xs text-gray-400 dark:text-slate-500">
                Drop cards here or add new ones
              </div>
            )}
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
                onPriorityChange={onPriorityChange}
                onTimerToggle={onTimerToggle}
                onComplete={onComplete}
              />
            ))}
          </SortableContext>

          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Card title..."
                autoFocus
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancel()
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (newCardTitle.trim()) {
                      createCardMutation.mutate(newCardTitle.trim())
                    }
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newCardTitle.trim() || createCardMutation.isPending}
                  className="flex-1 px-3 py-1.5 bg-accent hover:bg-accent/90 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {createCardMutation.isPending ? 'Creating...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm rounded-lg transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full text-left text-xs text-gray-500 dark:text-slate-400 hover:text-accent dark:hover:text-accent transition-colors py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Card
            </button>
          )}
        </div>
      )}
    </div>
  )
}
