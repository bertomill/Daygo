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
      className={`bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
        todo.completed
          ? 'shadow-bevel-md ring-2 ring-bevel-blue/30'
          : 'shadow-bevel hover:shadow-bevel-md'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          todo.completed
            ? 'bg-bevel-blue border-bevel-blue'
            : 'border-gray-300 dark:border-slate-500 hover:border-gray-400 dark:hover:border-slate-400'
        }`}
      >
        {todo.completed && <Check className="w-5 h-5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-base transition-colors duration-200 ${
          todo.completed
            ? 'text-bevel-text-secondary dark:text-slate-500 line-through'
            : 'text-bevel-text dark:text-white'
        }`}>
          {todo.text}
        </h3>
      </div>

      {/* Options Button */}
      <button
        onClick={handleOptionsClick}
        className="p-2 -m-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
        aria-label="Todo options"
      >
        <MoreHorizontal className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
      </button>
    </div>
  )
}
