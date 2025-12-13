'use client'

import Link from 'next/link'
import type { GoalWithHabits } from '../../src/types/database'

interface GoalCardProps {
  goal: GoalWithHabits
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

export function GoalCard({ goal }: GoalCardProps) {
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
      <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-750 transition-colors cursor-pointer">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{iconMap[goal.icon || ''] || '🎯'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-slate-400 truncate">{goal.description}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">{goal.metric_name}</span>
            <span className="text-white">
              {goal.metric_current} / {goal.metric_target}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(goal.progress)} transition-all`}
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">
            {goal.habits.length} linked habit{goal.habits.length !== 1 ? 's' : ''}
          </span>
          {daysRemaining !== null && (
            <span className={daysRemaining < 7 ? 'text-red-400' : 'text-slate-400'}>
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Deadline passed'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
