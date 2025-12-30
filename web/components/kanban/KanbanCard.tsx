'use client'

import { CheckSquare, Target } from 'lucide-react'
import type { KanbanCardWithDetails } from '@/lib/types/database'

interface KanbanCardProps {
  card: KanbanCardWithDetails
  onClick: () => void
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const completedSubtasks = card.subtasks.filter((s) => s.completed).length
  const totalSubtasks = card.subtasks.length

  return (
    <div
      onClick={onClick}
      className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-600"
    >
      <h4 className="font-medium text-sm text-gray-900 dark:text-white">
        {card.title}
      </h4>

      {card.description && (
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-1">
          {card.description}
        </p>
      )}

      {totalSubtasks > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-600 dark:text-slate-300">
          <CheckSquare className="w-3 h-3" />
          <span>
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
      )}

      {card.goal && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent dark:bg-accent/20 px-2 py-0.5 rounded">
            <Target className="w-3 h-3" />
            {card.goal.title}
          </span>
        </div>
      )}
    </div>
  )
}
