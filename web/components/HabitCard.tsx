'use client'

import { useState } from 'react'
import { Target, MoreHorizontal } from 'lucide-react'
import type { HabitWithLog } from '@/lib/types/database'

interface HabitCardProps {
  habit: HabitWithLog
  onEdit?: (habit: HabitWithLog) => void
}

export function HabitCard({ habit, onEdit }: HabitCardProps) {
  const [isGlowing, setIsGlowing] = useState(false)

  const handleClick = () => {
    setIsGlowing(!isGlowing)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(habit)
  }

  return (
    <div
      className={`bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
        isGlowing
          ? 'shadow-bevel-lg scale-[1.02] ring-2 ring-teal/30'
          : 'shadow-bevel hover:shadow-bevel-md'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 transition-all duration-200 ${
          isGlowing ? 'scale-125' : ''
        }`}>
          <Target className="w-6 h-6 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-bevel-text dark:text-white font-medium leading-relaxed">{habit.name}</h3>
          {habit.description && (
            <p className="text-sm text-bevel-text-secondary dark:text-slate-400 mt-1">{habit.description}</p>
          )}
        </div>
        <button
          onClick={handleOptionsClick}
          className="p-2 -m-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
          aria-label="Habit options"
        >
          <MoreHorizontal className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
        </button>
      </div>
    </div>
  )
}
