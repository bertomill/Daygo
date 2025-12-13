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

  const resetForm = () => {
    setShowCreateModal(false)
    setTitle('')
    setDescription('')
    setIcon('trophy')
    setMetricName('')
    setMetricTarget('')
    setDeadline('')
    setLinkedHabitIds([])
  }

  const handleCreate = () => {
    if (!title.trim() || !metricName.trim() || !metricTarget) return
    createGoalMutation.mutate()
  }

  const toggleHabitLink = (habitId: string) => {
    setLinkedHabitIds((prev) =>
      prev.includes(habitId)
        ? prev.filter((id) => id !== habitId)
        : [...prev, habitId]
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Goals</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No goals yet. Create your first goal!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-semibold text-white mb-4">Create Goal</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Run a marathon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="What's this goal about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {ICONS.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => setIcon(i.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors flex-shrink-0 ${
                        icon === i.id
                          ? 'bg-accent'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {i.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Metric Name
                  </label>
                  <input
                    type="text"
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g., Miles"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Target
                  </label>
                  <input
                    type="number"
                    value={metricTarget}
                    onChange={(e) => setMetricTarget(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g., 26"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {habits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Link Habits (optional)
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {habits.map((habit) => (
                      <label
                        key={habit.id}
                        className="flex items-center gap-3 p-2 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={linkedHabitIds.includes(habit.id)}
                          onChange={() => toggleHabitLink(habit.id)}
                          className="w-4 h-4 rounded border-slate-500"
                        />
                        <span className="text-white">{habit.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || !metricName.trim() || !metricTarget}
                className="flex-1 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white rounded-lg font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
