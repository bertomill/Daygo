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
  usedPriorities?: number[] // Which priorities (1, 2, 3) are already in use globally
}

const statusConfig = {
  todo: {
    label: 'To Do',
    color: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  done: {
    label: 'Done',
    color: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
}

export function KanbanStatusSection({
  status,
  columnId,
  cards,
  onCardClick,
  onPriorityChange,
  onTimerToggle,
  onComplete,
  usedPriorities = [],
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

  const config = statusConfig[status]

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full group py-1"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-5 h-5">
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400 transition-colors" />
            )}
          </div>
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className={`font-semibold text-sm ${config.color}`}>
            {config.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
            {cards.length}
          </span>
        </div>
      </button>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`space-y-3 ml-7 min-h-[80px] rounded-xl transition-all duration-200 p-3 ${
            isOver
              ? 'bg-accent/10 dark:bg-accent/20 ring-2 ring-accent/50 ring-inset'
              : cards.length === 0
                ? 'bg-gradient-to-b from-gray-50 to-transparent dark:from-slate-800/50 dark:to-transparent'
                : ''
          }`}
        >
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {cards.length === 0 && !isAdding && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                  Drop cards here
                </p>
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
                usedPriorities={usedPriorities}
              />
            ))}
          </SortableContext>

          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-gray-200/80 dark:ring-slate-700/80 overflow-hidden">
                <textarea
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                  rows={2}
                  className="w-full px-4 py-3 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none resize-none"
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
                <div className="flex gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="submit"
                    disabled={!newCardTitle.trim() || createCardMutation.isPending}
                    className="flex-1 px-4 py-2 bg-gradient-to-b from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    {createCardMutation.isPending ? 'Adding...' : 'Add Card'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full text-left text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-all duration-200 py-2.5 px-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:ring-1 hover:ring-gray-200/80 dark:hover:ring-slate-700/80 flex items-center gap-2 group"
            >
              <div className="w-5 h-5 rounded-md bg-gray-100 dark:bg-slate-700 group-hover:bg-accent/10 dark:group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                <Plus className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 group-hover:text-accent transition-colors" />
              </div>
              <span className="font-medium">Add Card</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
