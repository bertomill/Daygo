'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { GoalWithHabits } from '@/lib/types/database'

interface GoalCardProps {
  goal: GoalWithHabits
  onEdit?: (goalId: string) => void
}

const iconMap: Record<string, string> = {
  // Achievement & Success
  'trophy': '🏆',
  'star': '⭐',
  'medal': '🥇',
  'target': '🎯',
  'crown': '👑',
  // Health & Fitness
  'fitness': '💪',
  'heart': '❤️',
  'running': '🏃',
  'yoga': '🧘',
  'bike': '🚴',
  'swim': '🏊',
  'sleep': '😴',
  'salad': '🥗',
  'water': '💧',
  // Learning & Career
  'book': '📚',
  'graduation': '🎓',
  'bulb': '💡',
  'code-slash': '💻',
  'briefcase': '💼',
  'chart': '📈',
  // Finance
  'cash': '💰',
  'bank': '🏦',
  'piggy': '🐷',
  // Creativity & Hobbies
  'musical-notes': '🎵',
  'art': '🎨',
  'camera': '📷',
  'writing': '✍️',
  'guitar': '🎸',
  // Travel & Adventure
  'rocket': '🚀',
  'plane': '✈️',
  'mountain': '🏔️',
  'globe': '🌍',
  // Lifestyle
  'home': '🏠',
  'family': '👨‍👩‍👧‍👦',
  'dog': '🐕',
  'plant': '🌱',
  'pray': '🙏',
  'clock': '⏰',
  'calendar': '📅',
  'fire': '🔥',
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-success'
    if (progress >= 60) return 'bg-yellow-500'
    if (progress >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 hover:shadow-bevel-md transition-all cursor-pointer shadow-bevel">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-3xl">{iconMap[goal.icon || ''] || '🎯'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-bevel-text dark:text-white truncate text-lg">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-bevel-text-secondary dark:text-slate-400 truncate mt-1">{goal.description}</p>
            )}
          </div>
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(goal.id)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              aria-label="Edit goal"
            >
              <Pencil className="w-4 h-4 text-bevel-text-secondary dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-bevel-text-secondary dark:text-slate-400 font-medium">{goal.metric_name}</span>
            <span className="text-bevel-text dark:text-white font-semibold">
              {goal.metric_current} / {goal.metric_target}
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full ${getProgressColor(goal.progress)} transition-all rounded-full`}
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-bevel-text-secondary dark:text-slate-400">
            {goal.habits?.length ?? 0} linked habit{(goal.habits?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          {daysRemaining !== null && (
            <span className={daysRemaining < 7 ? 'text-bevel-red font-semibold' : 'text-bevel-text-secondary dark:text-slate-400'}>
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Deadline passed'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
