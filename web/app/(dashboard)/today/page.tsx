'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { habitsService } from '@/lib/services/habits'
import { mantrasService } from '@/lib/services/mantras'
import { journalService } from '@/lib/services/journal'
import { HabitCard } from '@/components/HabitCard'
import { MantraCard } from '@/components/MantraCard'
import { JournalCard } from '@/components/JournalCard'
import { ScoreRing } from '@/components/ScoreRing'
import type { HabitWithLog } from '@/lib/types/database'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (formatDate(date) === formatDate(today)) return 'Today'
  if (formatDate(date) === formatDate(yesterday)) return 'Yesterday'
  if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow'

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function TodayPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<'habit' | 'mantra' | 'journal'>('habit')
  const [newItemText, setNewItemText] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [selectedHabit, setSelectedHabit] = useState<HabitWithLog | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const dateStr = formatDate(selectedDate)

  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits', user?.id, dateStr],
    queryFn: () => habitsService.getHabitsWithLogs(user!.id, dateStr),
    enabled: !!user,
  })

  const { data: mantras = [], isLoading: mantrasLoading } = useQuery({
    queryKey: ['mantras', user?.id],
    queryFn: () => mantrasService.getMantras(user!.id),
    enabled: !!user,
  })

  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ['journal-prompts', user?.id, dateStr],
    queryFn: () => journalService.getPromptsWithEntries(user!.id, dateStr),
    enabled: !!user,
  })

  // Calculate score from displayed habits (only habits created on or before selected date)
  const score = habits.length > 0
    ? Math.round((habits.filter(h => h.completed).length / habits.length) * 100)
    : 0

  const toggleHabitMutation = useMutation({
    mutationFn: ({ habitId, completed }: { habitId: string; completed: boolean }) =>
      habitsService.toggleHabitCompletion(user!.id, habitId, dateStr, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', user?.id, dateStr] })
    },
  })

  const saveEntryMutation = useMutation({
    mutationFn: ({ promptId, entry }: { promptId: string; entry: string }) =>
      journalService.saveEntry(user!.id, promptId, entry, dateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', user?.id, dateStr] })
    },
  })

  const createHabitMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      habitsService.createHabit(user!.id, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      setShowAddModal(false)
      setNewItemText('')
      setNewItemDescription('')
    },
  })

  const createMantraMutation = useMutation({
    mutationFn: (text: string) => mantrasService.createMantra(user!.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] })
      setShowAddModal(false)
      setNewItemText('')
    },
  })

  const createPromptMutation = useMutation({
    mutationFn: (prompt: string) => journalService.createPrompt(user!.id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts'] })
      setShowAddModal(false)
      setNewItemText('')
    },
  })

  const deleteHabitMutation = useMutation({
    mutationFn: (habitId: string) => habitsService.deleteHabit(habitId, dateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      setSelectedHabit(null)
      setShowDeleteConfirm(false)
    },
  })

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    if (addType === 'habit') {
      createHabitMutation.mutate({ name: newItemText, description: newItemDescription || undefined })
    } else if (addType === 'mantra') {
      createMantraMutation.mutate(newItemText)
    } else {
      createPromptMutation.mutate(newItemText)
    }
  }

  const isLoading = habitsLoading || mantrasLoading || promptsLoading

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevDay}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <h1 className="text-xl font-semibold text-white">
          {formatDisplayDate(selectedDate)}
        </h1>
        <button
          onClick={handleNextDay}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center mb-8">
        <ScoreRing score={score} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mantras */}
          {mantras.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Mantras
              </h2>
              <div className="space-y-3">
                {mantras.map((mantra) => (
                  <MantraCard key={mantra.id} mantra={mantra} />
                ))}
              </div>
            </section>
          )}

          {/* Habits */}
          {habits.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Habits
              </h2>
              <div className="space-y-3">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggle={(habitId, completed) =>
                      toggleHabitMutation.mutate({ habitId, completed })
                    }
                    onEdit={(h) => setSelectedHabit(h)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Journal Prompts */}
          {prompts.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Journal
              </h2>
              <div className="space-y-3">
                {prompts.map((prompt) => (
                  <JournalCard
                    key={prompt.id}
                    prompt={prompt}
                    onSave={(promptId, entry) =>
                      saveEntryMutation.mutate({ promptId, entry })
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {habits.length === 0 && mantras.length === 0 && prompts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No items yet. Add your first habit, mantra, or journal prompt!</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Item</h2>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {(['habit', 'mantra', 'journal'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setAddType(type)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium capitalize transition-colors ${
                    addType === type
                      ? type === 'habit'
                        ? 'bg-teal text-white'
                        : type === 'mantra'
                        ? 'bg-mantra text-white'
                        : 'bg-journal text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent mb-3"
              placeholder={
                addType === 'habit'
                  ? 'Habit name...'
                  : addType === 'mantra'
                  ? 'Your mantra...'
                  : 'Journal prompt...'
              }
              autoFocus
            />

            {addType === 'habit' && (
              <input
                type="text"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent mb-4"
                placeholder="Description (optional)"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewItemText('')
                  setNewItemDescription('')
                }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItemText.trim()}
                className="flex-1 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Detail Modal */}
      {selectedHabit && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedHabit.name}</h2>
                {selectedHabit.description && (
                  <p className="text-slate-400 mt-1">{selectedHabit.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedHabit(null)}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Habit
            </button>

            <p className="text-sm text-slate-500 mt-3 text-center">
              Deleting removes this habit from today and future days only.
              Previous days will keep this habit.
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-white mb-2">Delete "{selectedHabit.name}"?</h2>
            <p className="text-slate-400 mb-6">
              This habit will be removed from today and all future days. Your past progress will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedHabit(null)
                }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteHabitMutation.mutate(selectedHabit.id)}
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
