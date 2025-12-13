'use client'

import { Check } from 'lucide-react'
import type { HabitWithLog } from '@/lib/types/database'

interface HabitCardProps {
  habit: HabitWithLog
  onToggle: (habitId: string, completed: boolean) => void
  onEdit?: (habit: HabitWithLog) => void
}

export function HabitCard({ habit, onToggle, onEdit }: HabitCardProps) {
  return (
    <div
      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
      onClick={() => onEdit?.(habit)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(habit.id, !habit.completed)
        }}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
          habit.completed
            ? 'bg-teal border-teal'
            : 'border-gray-300 dark:border-slate-500 hover:border-teal'
        }`}
      >
        {habit.completed && <Check className="w-5 h-5 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
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
