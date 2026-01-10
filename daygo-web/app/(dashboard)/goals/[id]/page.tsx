'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { goalsService } from '@/lib/services/goals'

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

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [newProgress, setNewProgress] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const goalId = params.id as string

  const { data: goal, isLoading } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalsService.getGoalById(goalId),
    enabled: !!goalId,
  })

  const updateProgressMutation = useMutation({
    mutationFn: (value: number) => goalsService.updateGoalProgress(goalId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setNewProgress('')
    },
  })

  const deleteGoalMutation = useMutation({
    mutationFn: () => goalsService.deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      router.push('/goals')
    },
  })

  const handleUpdateProgress = () => {
    const value = parseInt(newProgress)
    if (!isNaN(value) && value >= 0) {
      updateProgressMutation.mutate(value)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-gray-500 dark:text-slate-400">Goal not found</p>
      </div>
    )
  }

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
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen bg-bevel-bg dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-bevel-text-secondary dark:text-slate-400" />
        </button>
        <h1 className="text-2xl font-bold text-bevel-text dark:text-white flex-1">Goal Details</h1>
        <button
          onClick={() => router.push(`/goals?edit=${goalId}`)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Pencil className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>

      {/* Goal Info */}
      <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-bevel">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-4xl">{iconMap[goal.icon || ''] || '🎯'}</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{goal.title}</h2>
            {goal.description && (
              <p className="text-gray-500 dark:text-slate-400 mt-1">{goal.description}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-slate-400">{goal.metric_name}</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {goal.metric_current} / {goal.metric_target}
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(goal.progress)} transition-all`}
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <p className="text-center text-2xl font-bold text-gray-900 dark:text-white mt-3">
            {Math.round(goal.progress)}%
          </p>
        </div>

        {/* Deadline */}
        {daysRemaining !== null && (
          <div className={`text-center py-2 rounded-lg ${
            daysRemaining < 7 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
          }`}>
            {daysRemaining > 0
              ? `${daysRemaining} days remaining`
              : daysRemaining === 0
              ? 'Deadline is today!'
              : 'Deadline has passed'}
          </div>
        )}
      </div>

      {/* Update Progress */}
      <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 mb-6 shadow-bevel">
        <h3 className="text-xs font-semibold text-bevel-text-secondary dark:text-slate-400 mb-4 uppercase tracking-wider">
          Update Progress
        </h3>
        <div className="flex gap-3">
          <input
            type="number"
            value={newProgress}
            onChange={(e) => setNewProgress(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={`Current: ${goal.metric_current}`}
          />
          <button
            onClick={handleUpdateProgress}
            disabled={!newProgress}
            className="px-6 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white rounded-lg font-medium transition-colors"
          >
            Update
          </button>
        </div>
      </div>

      {/* Linked Habits */}
      {goal.habits.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
            Linked Habits
          </h3>
          <div className="space-y-2">
            {goal.habits.map((habit) => (
              <div
                key={habit.id}
                className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-gray-900 dark:text-white"
              >
                {habit.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Goal?</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              This will permanently delete "{goal.title}" and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteGoalMutation.mutate()}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
