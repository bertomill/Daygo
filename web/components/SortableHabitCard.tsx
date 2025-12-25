'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check, MoreHorizontal } from 'lucide-react'
import type { HabitWithLog } from '@/lib/types/database'

interface SortableHabitCardProps {
  habit: HabitWithLog
  onToggle: (habitId: string, completed: boolean) => void
  onEdit?: (habit: HabitWithLog) => void
}

export function SortableHabitCard({ habit, onToggle, onEdit }: SortableHabitCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleCardClick = () => {
    onToggle(habit.id, !habit.completed)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(habit)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`bg-white dark:bg-slate-800 border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'opacity-50 shadow-lg scale-[1.02]'
          : habit.completed
            ? 'shadow-[0_0_25px_8px_rgba(20,184,166,0.35)] scale-[1.01] border-teal/60'
            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Checkbox */}
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          habit.completed
            ? 'bg-teal border-teal scale-110'
            : 'border-gray-300 dark:border-slate-500'
        }`}
      >
        {habit.completed && <Check className="w-5 h-5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium transition-colors duration-200 ${
          habit.completed
            ? 'text-gray-400 dark:text-slate-500 line-through'
            : 'text-gray-900 dark:text-white'
        }`}>
          {habit.name}
        </h3>
        {habit.description && (
          <p className="text-sm text-gray-400 dark:text-slate-500 truncate">{habit.description}</p>
        )}
      </div>

      {/* Options Button */}
      <button
        onClick={handleOptionsClick}
        className="p-1 -m-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors flex-shrink-0"
        aria-label="Habit options"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-400 dark:text-slate-500" />
      </button>
    </div>
  )
}
