'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check } from 'lucide-react'
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm ${
        isDragging ? 'opacity-50 shadow-lg scale-[1.02]' : 'hover:bg-gray-50 dark:hover:bg-slate-700'
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
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(habit.id, !habit.completed)
        }}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          habit.completed
            ? 'bg-teal border-teal'
            : 'border-gray-300 dark:border-slate-500 hover:border-teal'
        }`}
      >
        {habit.completed && <Check className="w-5 h-5 text-white" />}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onEdit?.(habit)}
      >
        <h3 className={`font-medium ${habit.completed ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-900 dark:text-white'}`}>
          {habit.name}
        </h3>
        {habit.description && (
          <p className="text-sm text-gray-400 dark:text-slate-500 truncate">{habit.description}</p>
        )}
      </div>
    </div>
  )
}
