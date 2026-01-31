'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check, MoreHorizontal } from 'lucide-react'
import type { Todo } from '@/lib/types/database'

interface SortableTodoCardProps {
  todo: Todo
  onToggle: (todoId: string, completed: boolean) => void
  onEdit?: (todo: Todo) => void
}

export function SortableTodoCard({ todo, onToggle, onEdit }: SortableTodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
  }

  const handleCardClick = () => {
    onToggle(todo.id, !todo.completed)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(todo)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'opacity-50 shadow-bevel-lg scale-[1.02]'
          : todo.completed
            ? 'shadow-bevel-md ring-2 ring-bevel-blue/30'
            : 'shadow-bevel hover:shadow-bevel-md'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 text-bevel-text-secondary dark:text-slate-400 hover:text-bevel-text dark:hover:text-slate-200 cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5" />
      </button>

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
