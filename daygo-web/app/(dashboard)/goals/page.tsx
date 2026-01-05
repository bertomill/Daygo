'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { goalsService } from '@/lib/services/goals'
import { habitsService } from '@/lib/services/habits'
import { GoalCard } from '@/components/GoalCard'

const ICONS = [
  // Achievement & Success
  { id: 'trophy', emoji: '🏆' },
  { id: 'star', emoji: '⭐' },
  { id: 'medal', emoji: '🥇' },
  { id: 'target', emoji: '🎯' },
  { id: 'crown', emoji: '👑' },
  // Health & Fitness
  { id: 'fitness', emoji: '💪' },
  { id: 'heart', emoji: '❤️' },
  { id: 'running', emoji: '🏃' },
  { id: 'yoga', emoji: '🧘' },
  { id: 'bike', emoji: '🚴' },
  { id: 'swim', emoji: '🏊' },
  { id: 'sleep', emoji: '😴' },
  { id: 'salad', emoji: '🥗' },
  { id: 'water', emoji: '💧' },
  // Learning & Career
  { id: 'book', emoji: '📚' },
  { id: 'graduation', emoji: '🎓' },
  { id: 'bulb', emoji: '💡' },
  { id: 'code-slash', emoji: '💻' },
  { id: 'briefcase', emoji: '💼' },
  { id: 'chart', emoji: '📈' },
  // Finance
  { id: 'cash', emoji: '💰' },
  { id: 'bank', emoji: '🏦' },
  { id: 'piggy', emoji: '🐷' },
  // Creativity & Hobbies
  { id: 'musical-notes', emoji: '🎵' },
  { id: 'art', emoji: '🎨' },
  { id: 'camera', emoji: '📷' },
  { id: 'writing', emoji: '✍️' },
  { id: 'guitar', emoji: '🎸' },
  // Travel & Adventure
  { id: 'rocket', emoji: '🚀' },
  { id: 'plane', emoji: '✈️' },
  { id: 'mountain', emoji: '🏔️' },
  { id: 'globe', emoji: '🌍' },
  // Lifestyle
  { id: 'home', emoji: '🏠' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'dog', emoji: '🐕' },
  { id: 'plant', emoji: '🌱' },
  { id: 'pray', emoji: '🙏' },
  { id: 'clock', emoji: '⏰' },
  { id: 'calendar', emoji: '📅' },
  { id: 'fire', emoji: '🔥' },
]

export default function GoalsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('trophy')
  const [metricName, setMetricName] = useState('')
  const [metricTarget, setMetricTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [linkedHabitIds, setLinkedHabitIds] = useState<string[]>([])

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => goalsService.getGoalsWithHabits(user!.id),
    enabled: !!user,
  })

  const { data: habits = [] } = useQuery({
    queryKey: ['all-habits', user?.id],
    queryFn: () => habitsService.getHabits(user!.id),
    enabled: !!user,
  })

  const createGoalMutation = useMutation({
    mutationFn: () =>
      goalsService.createGoal(
        user!.id,
        title,
        description || null,
        icon,
        metricName,
        parseInt(metricTarget),
        deadline || null,
        linkedHabitIds
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      resetForm()
    },
  })

  const updateGoalMutation = useMutation({
    mutationFn: () =>
      goalsService.updateGoal(
        editingGoalId!,
        title,
        description || null,
        icon,
        metricName,
        parseInt(metricTarget),
        deadline || null,
        linkedHabitIds
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      resetForm()
    },
  })

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => goalsService.deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  const resetForm = () => {
    setShowCreateModal(false)
    setEditingGoalId(null)
    setTitle('')
    setDescription('')
    setIcon('trophy')
    setMetricName('')
    setMetricTarget('')
    setDeadline('')
    setLinkedHabitIds([])
  }

  const handleEdit = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    setEditingGoalId(goalId)
    setTitle(goal.title)
    setDescription(goal.description || '')
    setIcon(goal.icon || 'trophy')
    setMetricName(goal.metric_name)
    setMetricTarget(goal.metric_target.toString())
    setDeadline(goal.deadline || '')
    setLinkedHabitIds(goal.habits?.map((h) => h.id) || [])
  }

  const handleDelete = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoalMutation.mutate(goalId)
      resetForm()
    }
  }

  const handleSubmit = () => {
    if (!title.trim() || !metricName.trim() || !metricTarget) return
    if (editingGoalId) {
      updateGoalMutation.mutate()
    } else {
      createGoalMutation.mutate()
    }
  }

  const toggleHabitLink = (habitId: string) => {
    setLinkedHabitIds((prev) =>
      prev.includes(habitId)
        ? prev.filter((id) => id !== habitId)
        : [...prev, habitId]
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen bg-bevel-bg dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-bevel-text dark:text-white mb-6">Goals</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-slate-400 mb-4">No goals yet. Create your first goal!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 w-16 h-16 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center shadow-bevel-lg hover:shadow-bevel-md transition-all"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Create/Edit Goal Modal */}
      {(showCreateModal || editingGoalId) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-bevel-card dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-bevel-lg">
            <h2 className="text-xl font-bold text-bevel-text dark:text-white mb-5">
              {editingGoalId ? 'Edit Goal' : 'Create Goal'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-bevel-text-secondary dark:text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-bevel-text dark:text-white placeholder-bevel-text-secondary dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="e.g., Run a marathon"
                />
              </div>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  title.trim() ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <label className="block text-sm font-semibold text-bevel-text-secondary dark:text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-bevel-text dark:text-white placeholder-bevel-text-secondary dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="What's this goal about?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-bevel-text-secondary dark:text-slate-300 mb-3">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {ICONS.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => setIcon(i.id)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all flex-shrink-0 shadow-bevel-sm ${
                        icon === i.id
                          ? 'bg-accent shadow-bevel-md scale-110'
                          : 'bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 hover:shadow-bevel'
                      }`}
                    >
                      {i.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-bevel-text-secondary dark:text-slate-300 mb-2">
                    Metric Name
                  </label>
                  <input
                    type="text"
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-bevel-text dark:text-white placeholder-bevel-text-secondary dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="e.g., Miles"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-bevel-text-secondary dark:text-slate-300 mb-2">
                    Target
                  </label>
                  <input
                    type="number"
                    value={metricTarget}
                    onChange={(e) => setMetricTarget(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-bevel-text dark:text-white placeholder-bevel-text-secondary dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="e.g., 26"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-bevel-text-secondary dark:text-slate-300 mb-2">
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-bevel-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>

              {habits.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-bevel-text-secondary dark:text-slate-300 mb-3">
                    Link Habits (optional)
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {habits.map((habit) => (
                      <label
                        key={habit.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 shadow-bevel-sm transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={linkedHabitIds.includes(habit.id)}
                          onChange={() => toggleHabitLink(habit.id)}
                          className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-slate-500 text-accent focus:ring-2 focus:ring-accent"
                        />
                        <span className="text-bevel-text dark:text-white font-medium">{habit.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-bevel-text dark:text-white rounded-xl font-semibold transition-all shadow-bevel-sm hover:shadow-bevel"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !metricName.trim() || !metricTarget}
                className="flex-1 py-3.5 bg-accent hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-bevel-sm hover:shadow-bevel"
              >
                {editingGoalId ? 'Update' : 'Create'}
              </button>
            </div>

            {editingGoalId && (
              <button
                onClick={() => handleDelete(editingGoalId)}
                className="w-full mt-3 py-3.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-semibold transition-all"
              >
                Delete Goal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
