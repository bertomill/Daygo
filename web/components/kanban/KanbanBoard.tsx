'use client'

import { Plus } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import type {
  KanbanColumnWithCards,
  KanbanCardWithDetails,
  Goal,
} from '@/lib/types/database'

interface KanbanBoardProps {
  columns: KanbanColumnWithCards[]
  onCardClick: (card: KanbanCardWithDetails) => void
  onAddColumn: () => void
  onEditColumn: (column: KanbanColumnWithCards) => void
}

export function KanbanBoard({
  columns,
  onCardClick,
  onAddColumn,
  onEditColumn,
}: KanbanBoardProps) {
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 px-4 pb-4 pt-4 min-w-min h-full">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onCardClick={onCardClick}
            onEditColumn={onEditColumn}
          />
        ))}

        <button
          onClick={onAddColumn}
          className="flex-shrink-0 w-80 h-fit bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 hover:border-accent dark:hover:border-accent hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-slate-400">
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Column</span>
          </div>
        </button>
      </div>
    </div>
  )
}
