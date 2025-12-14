'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Sparkles, RefreshCw } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAuthStore } from '@/lib/auth-store'
import { habitsService } from '@/lib/services/habits'
import { mantrasService } from '@/lib/services/mantras'
import { journalService } from '@/lib/services/journal'
import { goalsService } from '@/lib/services/goals'
import { pepTalksService, type PepTalk } from '@/lib/services/pepTalks'
import { SortableHabitCard } from '@/components/SortableHabitCard'
import { MantraCard } from '@/components/MantraCard'
import { JournalCard } from '@/components/JournalCard'
import { ScoreRing } from '@/components/ScoreRing'
import type { HabitWithLog, Mantra } from '@/lib/types/database'

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
  const [addType, setAddType] = useState<'habit' | 'mantra' | 'journal' | 'pep-talk'>('habit')
  const [newItemText, setNewItemText] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [selectedHabit, setSelectedHabit] = useState<HabitWithLog | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null)
  const [showAddHint, setShowAddHint] = useState(false)
  const pepTalkTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Check if we should show the onboarding hint
  useEffect(() => {
    const hintDismissed = localStorage.getItem('daygo-add-hint-dismissed')
    const justOnboarded = localStorage.getItem('daygo-just-onboarded')

    if (justOnboarded && !hintDismissed) {
      // Small delay so the page loads first
      const timer = setTimeout(() => {
        setShowAddHint(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismissAddHint = () => {
    setShowAddHint(false)
    localStorage.setItem('daygo-add-hint-dismissed', 'true')
    localStorage.removeItem('daygo-just-onboarded')
  }

  // Auto-resize pep talk textarea
  useEffect(() => {
    if (pepTalkTextareaRef.current) {
      pepTalkTextareaRef.current.style.height = 'auto'
      pepTalkTextareaRef.current.style.height = pepTalkTextareaRef.current.scrollHeight + 'px'
    }
  }, [newItemText])

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

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => goalsService.getGoals(user!.id),
    enabled: !!user,
  })

  const { data: todaysPepTalk } = useQuery({
    queryKey: ['pep-talk', user?.id, dateStr],
    queryFn: () => pepTalksService.getPepTalkForDate(user!.id, dateStr),
    enabled: !!user,
  })

  const pepTalkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/pep-talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      })
      if (!response.ok) throw new Error('Failed to generate pep talk')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      setNewItemText('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setNewItemText(prev => prev + text)
      }

      return true
    },
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

  const reorderHabitsMutation = useMutation({
    mutationFn: (orderedIds: string[]) => habitsService.reorderHabits(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  const deleteMantraMutation = useMutation({
    mutationFn: (mantraId: string) => mantrasService.deleteMantra(mantraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] })
      setSelectedMantra(null)
    },
  })

  const savePepTalkMutation = useMutation({
    mutationFn: (text: string) => pepTalksService.savePepTalk(user!.id, text, dateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pep-talk', user?.id, dateStr] })
      setShowAddModal(false)
      setNewItemText('')
    },
  })

  const deletePepTalkMutation = useMutation({
    mutationFn: () => pepTalksService.deletePepTalk(user!.id, dateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pep-talk', user?.id, dateStr] })
    },
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id)
      const newIndex = habits.findIndex((h) => h.id === over.id)
      const newOrder = arrayMove(habits, oldIndex, newIndex)
      const orderedIds = newOrder.map((h) => h.id)
      reorderHabitsMutation.mutate(orderedIds)
    }
  }

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
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-400 dark:text-slate-400" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {formatDisplayDate(selectedDate)}
        </h1>
        <button
          onClick={handleNextDay}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-400 dark:text-slate-400" />
        </button>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center mb-8">
        <ScoreRing score={score} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Pep Talk */}
          {todaysPepTalk && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
                Today&apos;s Pep Talk
              </h2>
              <div
                className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/30 rounded-xl p-4 cursor-pointer hover:from-purple-500/20 hover:to-pink-500/20 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30 transition-all"
                onClick={() => deletePepTalkMutation.mutate()}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white italic">{todaysPepTalk.text}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Tap to remove</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Mantras */}
          {mantras.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
                Mantras
              </h2>
              <div className="space-y-3">
                {mantras.map((mantra) => (
                  <MantraCard
                    key={mantra.id}
                    mantra={mantra}
                    onEdit={(m) => setSelectedMantra(m)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Habits */}
          {habits.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
                Habits
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={habits.map((h) => h.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {habits.map((habit) => (
                      <SortableHabitCard
                        key={habit.id}
                        habit={habit}
                        onToggle={(habitId, completed) =>
                          toggleHabitMutation.mutate({ habitId, completed })
                        }
                        onEdit={(h) => setSelectedHabit(h)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          )}

          {/* Journal Prompts */}
          {prompts.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
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
              <p className="text-gray-500 dark:text-slate-400 mb-4">No items yet. Add your first habit, mantra, or journal prompt!</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-24 right-4">
        {/* Onboarding hint tooltip */}
        {showAddHint && (
          <div className="absolute bottom-16 right-0 mb-2 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-4 w-64">
              <p className="text-gray-900 dark:text-white font-medium mb-1">
                Add habits here
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                Tap the + button to add habits, mantras, and journal prompts.
              </p>
              <button
                onClick={dismissAddHint}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Got it
              </button>
            </div>
            {/* Arrow pointing to button */}
            <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-gray-200 dark:border-slate-700 transform rotate-45" />
          </div>
        )}
        <button
          onClick={() => {
            setShowAddModal(true)
            if (showAddHint) dismissAddHint()
          }}
          className={`w-14 h-14 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center shadow-lg transition-all ${
            showAddHint ? 'ring-4 ring-accent/30 animate-pulse' : ''
          }`}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Item</h2>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {(['habit', 'mantra', 'journal', 'pep-talk'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setAddType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium capitalize transition-colors text-sm ${
                    addType === type
                      ? type === 'habit'
                        ? 'bg-teal text-white'
                        : type === 'mantra'
                        ? 'bg-mantra text-white'
                        : type === 'journal'
                        ? 'bg-journal text-white'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {type === 'pep-talk' ? 'Pep Talk' : type}
                </button>
              ))}
            </div>

            {addType === 'pep-talk' ? (
              <div className="space-y-3">
                <textarea
                  ref={pepTalkTextareaRef}
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none overflow-hidden min-h-[60px]"
                  placeholder="Your pep talk will appear here..."
                  rows={2}
                />
                <button
                  onClick={() => pepTalkMutation.mutate()}
                  disabled={pepTalkMutation.isPending || goals.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  {pepTalkMutation.isPending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {goals.length === 0 ? 'Add goals first' : 'Generate with AI'}
                    </>
                  )}
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewItemText('')
                      setNewItemDescription('')
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newItemText.trim()) {
                        savePepTalkMutation.mutate(newItemText)
                      }
                    }}
                    disabled={!newItemText.trim() || savePepTalkMutation.isPending}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {savePepTalkMutation.isPending ? 'Saving...' : 'Save for Today'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {addType === 'mantra' ? (
                  <textarea
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent mb-3 resize-none"
                    placeholder="Your mantra..."
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent mb-3"
                    placeholder={addType === 'habit' ? 'Habit name...' : 'Journal prompt...'}
                    autoFocus
                  />
                )}

                {addType === 'habit' && (
                  <input
                    type="text"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent mb-4"
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
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Habit Detail Modal */}
      {selectedHabit && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedHabit.name}</h2>
                {selectedHabit.description && (
                  <p className="text-gray-500 dark:text-slate-400 mt-1">{selectedHabit.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedHabit(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Habit
            </button>

            <p className="text-sm text-gray-400 dark:text-slate-500 mt-3 text-center">
              Deleting removes this habit from today and future days only.
              Previous days will keep this habit.
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete "{selectedHabit.name}"?</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              This habit will be removed from today and all future days. Your past progress will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedHabit(null)
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
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

      {/* Mantra Detail Modal */}
      {selectedMantra && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mantra</h2>
              <button
                onClick={() => setSelectedMantra(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-slate-300 italic mb-6">{selectedMantra.text}</p>
            <button
              onClick={() => deleteMantraMutation.mutate(selectedMantra.id)}
              disabled={deleteMantraMutation.isPending}
              className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {deleteMantraMutation.isPending ? 'Deleting...' : 'Delete Mantra'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
