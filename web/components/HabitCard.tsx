'use client'

import { Check } from 'lucide-react'
import type { HabitWithLog } from '../../src/types/database'

interface HabitCardProps {
  habit: HabitWithLog
  onToggle: (habitId: string, completed: boolean) => void
  onEdit?: (habit: HabitWithLog) => void
}

export function HabitCard({ habit, onToggle, onEdit }: HabitCardProps) {
  return (
    <div
      className="bg-slate-800 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-750 transition-colors"
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
            : 'border-slate-600 hover:border-teal'
        }`}
      >
        {habit.completed && <Check className="w-5 h-5 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium ${habit.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
          {habit.name}
        </h3>
        {habit.description && (
          <p className="text-sm text-slate-500 truncate">{habit.description}</p>
        )}
      </div>
    </div>
  )
}
