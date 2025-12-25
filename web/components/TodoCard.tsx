'use client'

import { Check, MoreHorizontal } from 'lucide-react'
import type { Todo } from '@/lib/types/database'

interface TodoCardProps {
  todo: Todo
  onToggle: (todoId: string, completed: boolean) => void
  onEdit?: (todo: Todo) => void
}

export function TodoCard({ todo, onToggle, onEdit }: TodoCardProps) {
  const handleCardClick = () => {
    onToggle(todo.id, !todo.completed)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(todo)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-slate-800 border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
        todo.completed
          ? 'shadow-[0_0_25px_8px_rgba(59,130,246,0.35)] scale-[1.01] border-blue-500/60'
          : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          todo.completed
            ? 'bg-blue-500 border-blue-500 scale-110'
            : 'border-gray-300 dark:border-slate-500'
        }`}
      >
        {todo.completed && <Check className="w-5 h-5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium transition-colors duration-200 ${
          todo.completed
            ? 'text-gray-400 dark:text-slate-500 line-through'
            : 'text-gray-900 dark:text-white'
        }`}>
          {todo.text}
        </h3>
      </div>

      {/* Options Button */}
      <button
        onClick={handleOptionsClick}
        className="p-1 -m-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors flex-shrink-0"
        aria-label="Todo options"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-400 dark:text-slate-500" />
      </button>
    </div>
  )
}
