'use client'

import { useState } from 'react'
import { MoreVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { KanbanStatusSection } from './KanbanStatusSection'
import type {
  KanbanColumnWithCards,
  KanbanCardWithDetails,
} from '@/lib/types/database'

interface KanbanColumnProps {
  column: KanbanColumnWithCards
  onCardClick: (card: KanbanCardWithDetails) => void
  onEditColumn: (column: KanbanColumnWithCards) => void
}

export function KanbanColumn({
  column,
  onCardClick,
  onEditColumn,
}: KanbanColumnProps) {
  const [showDescription, setShowDescription] = useState(false)

  return (
    <div className="flex-shrink-0 w-80 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-full">
      <div
        className="border-b border-gray-200 dark:border-slate-700"
        style={{ borderTopColor: column.color, borderTopWidth: '3px' }}
      >
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-2 flex-1 text-left group"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {column.title}
            </h3>
            {column.description && (
              <div className="ml-auto">
                {showDescription ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400" />
                )}
              </div>
            )}
          </button>
          <button
            onClick={() => onEditColumn(column)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors ml-2"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          </button>
        </div>
        {showDescription && column.description && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {column.description}
            </p>
          </div>
        )}
      </div>

      <div className="overflow-y-auto p-4 space-y-4 flex-1">
        <KanbanStatusSection
          status="todo"
          columnId={column.id}
          cards={column.todoCards}
          onCardClick={onCardClick}
        />
        <KanbanStatusSection
          status="in_progress"
          columnId={column.id}
          cards={column.inProgressCards}
          onCardClick={onCardClick}
        />
        <KanbanStatusSection
          status="done"
          columnId={column.id}
          cards={column.doneCards}
          onCardClick={onCardClick}
        />
      </div>
    </div>
  )
}
