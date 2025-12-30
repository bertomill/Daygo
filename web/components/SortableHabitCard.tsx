'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check, MoreHorizontal, X } from 'lucide-react'
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

  const isMissed = !!habit.missNote && !habit.completed

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
      className={`bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'opacity-50 shadow-bevel-lg scale-[1.02]'
          : habit.completed
            ? 'shadow-bevel-md ring-2 ring-bevel-green/30'
            : isMissed
              ? 'shadow-bevel-md ring-2 ring-bevel-red/30'
              : 'shadow-bevel hover:shadow-bevel-md'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 text-bevel-text-secondary dark:text-slate-400 hover:text-bevel-text dark:hover:text-slate-200 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Checkbox */}
      <div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          habit.completed
            ? 'bg-bevel-green border-bevel-green'
            : isMissed
              ? 'bg-bevel-red border-bevel-red'
              : 'border-gray-300 dark:border-slate-500 hover:border-gray-400 dark:hover:border-slate-400'
        }`}
      >
        {habit.completed && <Check className="w-5 h-5 text-white" />}
        {isMissed && <X className="w-5 h-5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-base transition-colors duration-200 ${
          habit.completed
            ? 'text-bevel-text-secondary dark:text-slate-500 line-through'
            : isMissed
              ? 'text-bevel-red dark:text-red-400'
              : 'text-bevel-text dark:text-white'
        }`}>
          {habit.name}
        </h3>
        {habit.description && !isMissed && (
          <p className="text-sm text-bevel-text-secondary dark:text-slate-400 truncate mt-1">{habit.description}</p>
        )}
        {isMissed && (
          <p className="text-sm text-bevel-red/80 dark:text-red-400/80 truncate italic mt-1">
            {habit.missNote}
          </p>
        )}
      </div>

      {/* Options Button */}
      <button
        onClick={handleOptionsClick}
        className="p-2 -m-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
        aria-label="Habit options"
      >
        <MoreHorizontal className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
      </button>
    </div>
  )
}
