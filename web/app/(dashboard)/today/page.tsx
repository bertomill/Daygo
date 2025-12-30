'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSwipeable } from 'react-swipeable'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, X, Sparkles, RefreshCw, Pencil } from 'lucide-react'
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
import { todosService } from '@/lib/services/todos'
import { visionsService } from '@/lib/services/visions'
import { scheduleService } from '@/lib/services/schedule'
import { calendarRulesService } from '@/lib/services/calendarRules'
import { habitMissNotesService } from '@/lib/services/habitMissNotes'
import { userPreferencesService } from '@/lib/services/userPreferences'
import { dailyNotesService } from '@/lib/services/dailyNotes'
import { scheduleTemplatesService } from '@/lib/services/scheduleTemplates'
import { SortableHabitCard } from '@/components/SortableHabitCard'
import { ScheduleGrid } from '@/components/ScheduleGrid'
import { CalendarRulesPanel } from '@/components/CalendarRulesPanel'
import { GoogleCalendarPanel } from '@/components/GoogleCalendarPanel'
import { SchedulePreferences } from '@/components/SchedulePreferences'
import { DailyNotes } from '@/components/DailyNotes'
import { ScheduleTemplates } from '@/components/ScheduleTemplates'
import { TimePicker } from '@/components/TimePicker'
import { MantraCard } from '@/components/MantraCard'
import { JournalCard } from '@/components/JournalCard'
import { TodoCard } from '@/components/TodoCard'
import { VisionCard } from '@/components/VisionCard'
import { ScoreRing } from '@/components/ScoreRing'
import { RichTextEditor } from '@/components/RichTextEditor'
import type { HabitWithLog, Mantra, Todo, Vision, JournalPromptWithEntry, ScheduleEvent, CalendarRule, Goal, ScheduleTemplate } from '@/lib/types/database'
import { calculateMissionScore } from '@/lib/services/missionScore'

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
  const [addType, setAddType] = useState<'habit' | 'mantra' | 'journal' | 'todo' | 'pep-talk' | 'vision' | 'schedule' | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [selectedHabit, setSelectedHabit] = useState<HabitWithLog | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null)
  const [isEditingVision, setIsEditingVision] = useState(false)
  const [editVisionText, setEditVisionText] = useState('')
  const [selectedJournal, setSelectedJournal] = useState<JournalPromptWithEntry | null>(null)
  const [isEditingJournal, setIsEditingJournal] = useState(false)
  const [editJournalText, setEditJournalText] = useState('')
  const [editJournalTemplate, setEditJournalTemplate] = useState('')
  const [showAddHint, setShowAddHint] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [planningStatus, setPlanningStatus] = useState<string>('')
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [newEventStartTime, setNewEventStartTime] = useState('09:00:00')
  const [newEventEndTime, setNewEventEndTime] = useState('09:30:00')
  const [showMissNoteModal, setShowMissNoteModal] = useState(false)
  const [missNoteText, setMissNoteText] = useState('')
  const [gcalNotification, setGcalNotification] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [slideInDirection, setSlideInDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const pepTalkTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Section collapse/expand state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('daygo-expanded-sections')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    // All sections expanded by default
    return {
      pepTalk: true,
      visions: true,
      mantras: true,
      habits: true,
      journal: true,
      todos: true,
      schedule: true,
    }
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newState = { ...prev, [section]: !prev[section] }
      localStorage.setItem('daygo-expanded-sections', JSON.stringify(newState))
      return newState
    })
  }

  // Check for Google Calendar connection callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gcal_connected') === 'true') {
      setGcalNotification('Google Calendar connected successfully!')
      queryClient.invalidateQueries({ queryKey: ['gcal-status'] })
      // Clean up URL
      window.history.replaceState({}, '', '/today')
      setTimeout(() => setGcalNotification(null), 4000)
    } else if (params.get('gcal_error')) {
      const error = params.get('gcal_error')
      setGcalNotification(`Failed to connect: ${error}`)
      window.history.replaceState({}, '', '/today')
      setTimeout(() => setGcalNotification(null), 4000)
    }
  }, [queryClient])

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

  // Close modals on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) {
          setShowAddModal(false)
          setAddType(null)
          setNewItemText('')
          setNewItemDescription('')
        }
        if (showMissNoteModal) {
          setShowMissNoteModal(false)
          setMissNoteText('')
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
          setSelectedHabit(null)
        } else if (selectedHabit) {
          setSelectedHabit(null)
        }
        if (selectedMantra) {
          setSelectedMantra(null)
        }
        if (selectedTodo) {
          setSelectedTodo(null)
        }
        if (selectedVision) {
          setSelectedVision(null)
          setIsEditingVision(false)
          setEditVisionText('')
        }
        if (selectedJournal) {
          setSelectedJournal(null)
          setIsEditingJournal(false)
          setEditJournalText('')
          setEditJournalTemplate('')
        }
        if (selectedEvent) {
          setSelectedEvent(null)
        }
        if (showScheduleModal) {
          setShowScheduleModal(false)
          setNewEventTitle('')
          setNewEventDescription('')
          setNewEventStartTime('09:00:00')
          setNewEventEndTime('09:30:00')
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showAddModal, showDeleteConfirm, showMissNoteModal, selectedHabit, selectedMantra, selectedTodo, selectedVision, selectedJournal, selectedEvent, showScheduleModal])

  // Keyboard shortcuts for Add modal type selection
  useEffect(() => {
    const handleTypeShortcut = (e: KeyboardEvent) => {
      // Only when add modal is open and no type is selected yet
      if (!showAddModal || addType !== null) return

      const key = e.key.toLowerCase()
      const shortcuts: Record<string, 'habit' | 'mantra' | 'journal' | 'todo' | 'pep-talk' | 'vision' | 'schedule'> = {
        'h': 'habit',
        'm': 'mantra',
        'j': 'journal',
        't': 'todo',
        'v': 'vision',
        'p': 'pep-talk',
        's': 'schedule',
      }

      if (shortcuts[key]) {
        e.preventDefault()
        setAddType(shortcuts[key])
      }
    }
    document.addEventListener('keydown', handleTypeShortcut)
    return () => document.removeEventListener('keydown', handleTypeShortcut)
  }, [showAddModal, addType])

  // Arrow key navigation for days
  useEffect(() => {
    const handleArrowKeys = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea or modal is open
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      if (showAddModal || showScheduleModal || selectedHabit || selectedMantra || selectedTodo || selectedVision || selectedJournal || selectedEvent) {
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedDate(prev => {
          const newDate = new Date(prev)
          newDate.setDate(newDate.getDate() - 1)
          return newDate
        })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedDate(prev => {
          const newDate = new Date(prev)
          newDate.setDate(newDate.getDate() + 1)
          return newDate
        })
      }
    }
    document.addEventListener('keydown', handleArrowKeys)
    return () => document.removeEventListener('keydown', handleArrowKeys)
  }, [showAddModal, showScheduleModal, selectedHabit, selectedMantra, selectedTodo, selectedVision, selectedJournal, selectedEvent])

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

  const { data: todos = [], isLoading: todosLoading } = useQuery({
    queryKey: ['todos', user?.id, dateStr],
    queryFn: () => todosService.getTodos(user!.id, dateStr),
    enabled: !!user,
  })

  const { data: visions = [], isLoading: visionsLoading } = useQuery({
    queryKey: ['visions', user?.id],
    queryFn: () => visionsService.getVisions(user!.id),
    enabled: !!user,
  })

  const { data: scheduleEvents = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', user?.id, dateStr],
    queryFn: () => scheduleService.getEvents(user!.id, dateStr),
    enabled: !!user,
  })

  const { data: calendarRules = [] } = useQuery({
    queryKey: ['calendar-rules', user?.id],
    queryFn: () => calendarRulesService.getRules(user!.id),
    enabled: !!user,
  })

  // User scheduling preferences (wake/bed time)
  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: () => userPreferencesService.getOrCreatePreferences(user!.id),
    enabled: !!user,
  })

  // Daily notes for context
  const { data: dailyNote } = useQuery({
    queryKey: ['daily-note', user?.id, dateStr],
    queryFn: () => dailyNotesService.getNote(user!.id, dateStr),
    enabled: !!user,
  })

  // Schedule templates
  const { data: scheduleTemplates = [] } = useQuery({
    queryKey: ['schedule-templates', user?.id],
    queryFn: () => scheduleTemplatesService.getTemplates(user!.id),
    enabled: !!user,
  })

  // Google Calendar connection status
  const { data: gcalStatus } = useQuery({
    queryKey: ['gcal-status'],
    queryFn: async () => {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) return { connected: false }
      const response = await fetch('/api/google-calendar/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!response.ok) return { connected: false }
      return response.json()
    },
    enabled: !!user,
  })

  const isGcalConnected = gcalStatus?.connected || false

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

  // Calculate mission score (based on schedule completion only)
  const missionScore = calculateMissionScore(habits, todos, scheduleEvents)
  const score = scheduleEvents.length > 0
    ? Math.round((scheduleEvents.filter(e => e.completed).length / scheduleEvents.length) * 100)
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

  const createTodoMutation = useMutation({
    mutationFn: (text: string) => todosService.createTodo(user!.id, text, dateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', user?.id, dateStr] })
      setShowAddModal(false)
      setNewItemText('')
    },
  })

  const createVisionMutation = useMutation({
    mutationFn: (text: string) => visionsService.createVision(user!.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visions'] })
      setShowAddModal(false)
      setNewItemText('')
    },
  })

  const deleteVisionMutation = useMutation({
    mutationFn: (visionId: string) => visionsService.deleteVision(visionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visions'] })
      setSelectedVision(null)
    },
  })

  const updateVisionMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      visionsService.updateVision(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visions'] })
      setSelectedVision(null)
      setIsEditingVision(false)
      setEditVisionText('')
    },
  })

  const toggleTodoMutation = useMutation({
    mutationFn: ({ todoId, completed }: { todoId: string; completed: boolean }) =>
      todosService.toggleTodo(todoId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', user?.id, dateStr] })
    },
  })

  const deleteTodoMutation = useMutation({
    mutationFn: (todoId: string) => todosService.deleteTodo(todoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', user?.id, dateStr] })
      setSelectedTodo(null)
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

  const updateJournalPromptMutation = useMutation({
    mutationFn: ({ id, prompt, templateText }: { id: string; prompt: string; templateText?: string }) =>
      journalService.updatePrompt(id, prompt, templateText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts'] })
      setSelectedJournal(null)
      setIsEditingJournal(false)
      setEditJournalText('')
      setEditJournalTemplate('')
    },
  })

  const deleteJournalPromptMutation = useMutation({
    mutationFn: (promptId: string) => journalService.deletePrompt(promptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts'] })
      setSelectedJournal(null)
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

  const createEventMutation = useMutation({
    mutationFn: () =>
      scheduleService.createEvent(
        user!.id,
        newEventTitle,
        dateStr,
        newEventStartTime,
        newEventEndTime,
        newEventDescription || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
      setShowScheduleModal(false)
      setShowAddModal(false)
      setNewEventTitle('')
      setNewEventDescription('')
      setNewEventStartTime('09:00:00')
      setNewEventEndTime('09:30:00')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => scheduleService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
      setSelectedEvent(null)
    },
  })

  const clearAiEventsMutation = useMutation({
    mutationFn: () => scheduleService.deleteAiEvents(user!.id, dateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
    },
  })

  const toggleEventCompletionMutation = useMutation({
    mutationFn: ({ eventId, completed }: { eventId: string; completed: boolean }) =>
      scheduleService.toggleEventCompletion(eventId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
    },
  })

  const resizeEventMutation = useMutation({
    mutationFn: ({ eventId, endTime }: { eventId: string; endTime: string }) =>
      scheduleService.updateEvent(eventId, { end_time: endTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
    },
  })

  // Google Calendar mutations
  const connectGcalMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const response = await fetch('/api/google-calendar/auth', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!response.ok) throw new Error('Failed to get auth URL')
      const { authUrl } = await response.json()
      window.location.href = authUrl
    },
  })

  const disconnectGcalMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!response.ok) throw new Error('Failed to disconnect')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gcal-status'] })
    },
  })

  const importGcalEventsMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const response = await fetch(`/api/google-calendar/events?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch events')
      const { events } = await response.json()

      // Create Daygo events from Google Calendar events
      for (const event of events) {
        if (!event.is_all_day) {
          await scheduleService.createEvent(
            user!.id,
            event.title,
            dateStr,
            event.start_time,
            event.end_time,
            event.description || undefined,
            false // not AI generated
          )
        }
      }
      return events.length
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
      alert(`Imported ${count} events from Google Calendar`)
    },
  })

  const exportGcalEventsMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      let exported = 0
      for (const event of scheduleEvents) {
        const response = await fetch('/api/google-calendar/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: event.title,
            date: dateStr,
            start_time: event.start_time,
            end_time: event.end_time,
            description: event.description,
          }),
        })
        if (response.ok) exported++
      }
      return exported
    },
    onSuccess: (count) => {
      alert(`Exported ${count} events to Google Calendar`)
    },
  })

  const createRuleMutation = useMutation({
    mutationFn: (ruleText: string) => calendarRulesService.createRule(user!.id, ruleText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-rules', user?.id] })
    },
  })

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      calendarRulesService.updateRule(ruleId, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-rules', user?.id] })
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => calendarRulesService.deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-rules', user?.id] })
    },
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: ({ wakeTime, bedTime }: { wakeTime: string; bedTime: string }) =>
      userPreferencesService.updatePreferences(user!.id, {
        wake_time: userPreferencesService.formatTimeForDB(wakeTime),
        bed_time: userPreferencesService.formatTimeForDB(bedTime),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] })
    },
  })

  const saveDailyNoteMutation = useMutation({
    mutationFn: (note: string) => dailyNotesService.saveNote(user!.id, dateStr, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-note', user?.id, dateStr] })
    },
  })

  const applyRulesMutation = useMutation({
    mutationFn: async () => {
      setPlanningStatus('Analyzing your day...')
      console.log('Calling AI to plan day...')

      const response = await fetch('/api/calendar-rules/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: calendarRules,
          existingEvents: scheduleEvents,
          habits: habits.map(h => ({ name: h.name, description: h.description })),
          todos: todos.map(t => ({ text: t.text, completed: t.completed })),
          goals: goals.map(g => ({ title: g.title, description: g.description })),
          visions: visions.map(v => ({ text: v.text })),
          mantras: mantras.map(m => ({ text: m.text })),
          date: dateStr,
          dailyNote: dailyNote?.note || '',
          preferences: {
            wake_time: userPreferences?.wake_time ? userPreferencesService.formatTimeForDisplay(userPreferences.wake_time) : '07:00',
            bed_time: userPreferences?.bed_time ? userPreferencesService.formatTimeForDisplay(userPreferences.bed_time) : '22:00',
          },
        }),
      })

      setPlanningStatus('AI is thinking...')

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', errorText)
        throw new Error('Failed to apply rules')
      }
      const data = await response.json()
      console.log('AI returned events:', data.events)
      console.log('DEBUG INFO:', data.debug)
      return data.events as { title: string; start_time: string; end_time: string; description?: string }[]
    },
    onSuccess: async (events) => {
      if (events.length === 0) {
        setPlanningStatus('No events to add')
        setTimeout(() => setPlanningStatus(''), 2000)
        return
      }

      // Create all AI-generated events with progress
      for (let i = 0; i < events.length; i++) {
        const event = events[i]
        setPlanningStatus(`Adding ${i + 1}/${events.length}: ${event.title}`)
        try {
          await scheduleService.createEvent(
            user!.id,
            event.title,
            dateStr,
            event.start_time,
            event.end_time,
            event.description,
            true // is_ai_generated
          )
          console.log('Created event:', event.title)
        } catch (err) {
          console.error('Failed to create event:', event.title, err)
        }
      }

      setPlanningStatus(`Done! Added ${events.length} events`)
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
      setTimeout(() => setPlanningStatus(''), 2000)
    },
    onError: (error) => {
      console.error('Apply rules mutation error:', error)
      setPlanningStatus('Error planning day')
      setTimeout(() => setPlanningStatus(''), 3000)
    },
  })

  const createMissNoteMutation = useMutation({
    mutationFn: ({ habitId, note }: { habitId: string; note: string }) =>
      habitMissNotesService.createMissNote(user!.id, habitId, dateStr, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', user?.id, dateStr] })
      setShowMissNoteModal(false)
      setSelectedHabit(null)
      setMissNoteText('')
    },
  })

  const deleteMissNoteMutation = useMutation({
    mutationFn: (habitId: string) =>
      habitMissNotesService.deleteMissNote(habitId, dateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', user?.id, dateStr] })
    },
  })

  // Schedule Template mutations
  const saveTemplateMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      scheduleTemplatesService.createTemplate(user!.id, name, scheduleEvents, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-templates', user?.id] })
    },
  })

  const applyTemplateMutation = useMutation({
    mutationFn: async (template: ScheduleTemplate) => {
      const templateEvents = scheduleTemplatesService.getTemplateEvents(template)

      // Create all events from the template
      for (const event of templateEvents) {
        await scheduleService.createEvent(
          user!.id,
          event.title,
          dateStr,
          event.start_time,
          event.end_time,
          event.description || undefined,
          event.is_ai_generated || false
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id, dateStr] })
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => scheduleTemplatesService.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-templates', user?.id] })
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

  const handlePrevDay = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setSwipeDirection('right') // Slide out to the right
    setTimeout(() => {
      setSelectedDate(prev => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() - 1)
        return newDate
      })
      setSwipeDirection(null)
      setSlideInDirection('left') // New content slides in from left
      setTimeout(() => {
        setSlideInDirection(null)
        setIsAnimating(false)
      }, 350)
    }, 300)
  }, [isAnimating])

  const handleNextDay = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setSwipeDirection('left') // Slide out to the left
    setTimeout(() => {
      setSelectedDate(prev => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() + 1)
        return newDate
      })
      setSwipeDirection(null)
      setSlideInDirection('right') // New content slides in from right
      setTimeout(() => {
        setSlideInDirection(null)
        setIsAnimating(false)
      }, 350)
    }, 300)
  }, [isAnimating])

  // Swipe/drag handlers for day navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextDay(),
    onSwipedRight: () => handlePrevDay(),
    trackMouse: true,
    trackTouch: true,
    delta: 50,
    swipeDuration: 500,
    preventScrollOnSwipe: false,
  })

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    if (addType === 'habit') {
      createHabitMutation.mutate({ name: newItemText, description: newItemDescription || undefined })
    } else if (addType === 'mantra') {
      createMantraMutation.mutate(newItemText)
    } else if (addType === 'todo') {
      createTodoMutation.mutate(newItemText)
    } else if (addType === 'vision') {
      createVisionMutation.mutate(newItemText)
    } else {
      createPromptMutation.mutate(newItemText)
    }
  }

  const isLoading = habitsLoading || mantrasLoading || promptsLoading || todosLoading || visionsLoading || scheduleLoading

  return (
    <div {...swipeHandlers} className="max-w-lg mx-auto px-4 py-6 pb-32 min-h-screen bg-bevel-bg dark:bg-slate-900">
      {/* Google Calendar notification toast */}
      {gcalNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium">{gcalNotification}</span>
          <button onClick={() => setGcalNotification(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
      <div className="flex flex-col items-center mb-8">
        <ScoreRing score={score} />
        {/* Schedule completion breakdown */}
        {scheduleEvents.length > 0 && (
          <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
            <span className="text-schedule font-medium">{scheduleEvents.filter(e => e.completed).length}</span>
            /{scheduleEvents.length} schedule items completed
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          className={`space-y-5 ${
            swipeDirection === 'left' ? 'animate-slide-out-left' :
            swipeDirection === 'right' ? 'animate-slide-out-right' :
            slideInDirection === 'left' ? 'animate-slide-in-left' :
            slideInDirection === 'right' ? 'animate-slide-in-right' :
            ''
          }`}
        >
          {/* Today's Pep Talk */}
          {todaysPepTalk && (
            <section>
              <button
                onClick={() => toggleSection('pepTalk')}
                className="w-full flex items-center justify-between mb-4 group"
              >
                <h2 className="text-xs font-semibold text-bevel-text-secondary dark:text-slate-400 uppercase tracking-wider">
                  Today&apos;s Pep Talk
                </h2>
                {expandedSections.pepTalk ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
              {expandedSections.pepTalk && (
                <div
                  className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5 cursor-pointer hover:shadow-bevel-md transition-all"
                  onClick={() => deletePepTalkMutation.mutate()}
                >
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-purple-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-bevel-text dark:text-white font-medium leading-relaxed italic">{todaysPepTalk.text}</p>
                      <p className="text-xs text-bevel-text-secondary dark:text-slate-400 mt-3">Tap to remove</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Visions */}
          {visions.length > 0 && (
            <section>
              <button
                onClick={() => toggleSection('visions')}
                className="w-full flex items-center justify-between mb-4 group"
              >
                <h2 className="text-xs font-semibold text-bevel-text-secondary dark:text-slate-400 uppercase tracking-wider">
                  Visions
                </h2>
                {expandedSections.visions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
              {expandedSections.visions && (
                <div className="space-y-3">
                  {visions.map((vision) => (
                    <VisionCard
                      key={vision.id}
                      vision={vision}
                      onEdit={(v) => setSelectedVision(v)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Mantras */}
          {mantras.length > 0 && (
            <section>
              <button
                onClick={() => toggleSection('mantras')}
                className="w-full flex items-center justify-between mb-4 group"
              >
                <h2 className="text-xs font-semibold text-bevel-text-secondary dark:text-slate-400 uppercase tracking-wider">
                  Mantras
                </h2>
                {expandedSections.mantras ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
              {expandedSections.mantras && (
                <div className="space-y-3">
                  {mantras.map((mantra) => (
                    <MantraCard
                      key={mantra.id}
                      mantra={mantra}
                      onEdit={(m) => setSelectedMantra(m)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Habits */}
          {habits.length > 0 && (
            <section>
              <button
                onClick={() => toggleSection('habits')}
                className="w-full flex items-center justify-between mb-4 group"
              >
                <h2 className="text-xs font-semibold text-bevel-text-secondary dark:text-slate-400 uppercase tracking-wider">
                  Habits
                </h2>
                {expandedSections.habits ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
              {expandedSections.habits && (
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
              )}
            </section>
          )}

          {/* Journal Prompts */}
          {prompts.length > 0 && (
            <section>
              <button
                onClick={() => toggleSection('journal')}
                className="w-full flex items-center justify-between mb-4 group"
              >
                <h2 className="text-xs font-semibold text-bevel-text-secondary dark:text-slate-400 uppercase tracking-wider">
                  Journal
                </h2>
                {expandedSections.journal ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
              {expandedSections.journal && (
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <JournalCard
                      key={prompt.id}
                      prompt={prompt}
                      onSave={(promptId, entry) =>
                        saveEntryMutation.mutate({ promptId, entry })
                      }
                      onEdit={(p) => {
                        setSelectedJournal(p)
                        setEditJournalText(p.prompt)
                        setEditJournalTemplate(p.template_text || '')
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* To-Dos */}
          {todos.length > 0 && (
            <section>
              <button
                onClick={() => toggleSection('todos')}
                className="w-full flex items-center justify-between mb-4 group"
              >
                <h2 className="text-xs font-semibold text-bevel-text-secondary dark:text-slate-400 uppercase tracking-wider">
                  To-Do
                </h2>
                {expandedSections.todos ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
              {expandedSections.todos && (
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={(todoId, completed) =>
                        toggleTodoMutation.mutate({ todoId, completed })
                      }
                      onEdit={(t) => setSelectedTodo(t)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Schedule */}
          <section>
            <button
              onClick={() => toggleSection('schedule')}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Schedule
              </h2>
              <div className="flex items-center gap-3">
                {scheduleEvents.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {scheduleEvents.filter(e => e.completed).length}/{scheduleEvents.length} completed
                  </span>
                )}
                {expandedSections.schedule ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </div>
            </button>
            {expandedSections.schedule && (
              <>
                <GoogleCalendarPanel
              isConnected={isGcalConnected}
              onConnect={() => connectGcalMutation.mutate()}
              onDisconnect={() => disconnectGcalMutation.mutate()}
              onImportEvents={() => importGcalEventsMutation.mutate()}
              onExportEvents={() => exportGcalEventsMutation.mutate()}
              isImporting={importGcalEventsMutation.isPending}
              isExporting={exportGcalEventsMutation.isPending}
            />
            <SchedulePreferences
              wakeTime={userPreferences?.wake_time ? userPreferencesService.formatTimeForDisplay(userPreferences.wake_time) : '07:00'}
              bedTime={userPreferences?.bed_time ? userPreferencesService.formatTimeForDisplay(userPreferences.bed_time) : '22:00'}
              onUpdate={(wake, bed) => updatePreferencesMutation.mutate({ wakeTime: wake, bedTime: bed })}
              isUpdating={updatePreferencesMutation.isPending}
            />
            <DailyNotes
              note={dailyNote?.note || ''}
              onSave={(note) => saveDailyNoteMutation.mutate(note)}
              isSaving={saveDailyNoteMutation.isPending}
            />
            <CalendarRulesPanel
              rules={calendarRules}
              onAddRule={(ruleText) => createRuleMutation.mutate(ruleText)}
              onToggleRule={(ruleId, isActive) => updateRuleMutation.mutate({ ruleId, isActive })}
              onDeleteRule={(ruleId) => deleteRuleMutation.mutate(ruleId)}
              onApplyRules={() => applyRulesMutation.mutate()}
              onClearAiEvents={() => clearAiEventsMutation.mutate()}
              isApplying={applyRulesMutation.isPending}
              hasAiEvents={scheduleEvents.some(e => e.is_ai_generated)}
              planningStatus={planningStatus}
            />
            <ScheduleTemplates
              templates={scheduleTemplates}
              currentEvents={scheduleEvents}
              onSaveTemplate={(name, description) =>
                saveTemplateMutation.mutate({ name, description })
              }
              onApplyTemplate={(template) => applyTemplateMutation.mutate(template)}
              onDeleteTemplate={(templateId) => deleteTemplateMutation.mutate(templateId)}
              isSaving={saveTemplateMutation.isPending}
            />
            <ScheduleGrid
              events={scheduleEvents}
              selectedDate={selectedDate}
              onAddEvent={(startTime, endTime) => {
                setNewEventStartTime(startTime)
                setNewEventEndTime(endTime)
                setShowScheduleModal(true)
              }}
              onEditEvent={(event) => setSelectedEvent(event)}
              onToggleComplete={(eventId, completed) =>
                toggleEventCompletionMutation.mutate({ eventId, completed })
              }
              onResizeEvent={(eventId, newEndTime) =>
                resizeEventMutation.mutate({ eventId, endTime: newEndTime })
              }
            />
              </>
            )}
          </section>

          {habits.length === 0 && mantras.length === 0 && prompts.length === 0 && todos.length === 0 && visions.length === 0 && (
            <div className="text-center py-16 px-6">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-bevel-text dark:text-white mb-2">
                Start your journey
              </h3>
              <p className="text-bevel-text-secondary dark:text-slate-400 mb-6 leading-relaxed">
                Add your first habit, mantra, vision, journal prompt, or to-do to begin tracking your day!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-all shadow-bevel-sm hover:shadow-bevel"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-24 right-4">
        {/* Onboarding hint tooltip */}
        {showAddHint && (
          <div className="absolute bottom-16 right-0 mb-2 animate-fade-in">
            <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel-lg p-5 w-64">
              <p className="text-bevel-text dark:text-white font-semibold mb-2">
                Add habits here
              </p>
              <p className="text-sm text-bevel-text-secondary dark:text-slate-400 mb-4 leading-relaxed">
                Tap the + button to add habits, mantras, and journal prompts.
              </p>
              <button
                onClick={dismissAddHint}
                className="text-sm text-accent hover:text-accent/80 font-semibold transition-colors"
              >
                Got it
              </button>
            </div>
            {/* Arrow pointing to button */}
            <div className="absolute -bottom-2 right-5 w-4 h-4 bg-bevel-card dark:bg-slate-800 shadow-bevel transform rotate-45" />
          </div>
        )}
        <button
          onClick={() => {
            setShowAddModal(true)
            if (showAddHint) dismissAddHint()
          }}
          className={`w-16 h-16 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center shadow-bevel-lg hover:shadow-bevel-md transition-all ${
            showAddHint ? 'ring-4 ring-accent/30 animate-pulse' : ''
          }`}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowAddModal(false)
            setAddType(null)
            setNewItemText('')
            setNewItemDescription('')
          }}
        >
          <div
            className="bg-bevel-card dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-bevel-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step 1: Type Selection */}
            {addType === null ? (
              <>
                <h2 className="text-xl font-bold text-bevel-text dark:text-white mb-5">Add New Item</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'habit' as const, label: 'Habit', key: 'H', color: 'bg-teal hover:bg-teal/90' },
                    { type: 'mantra' as const, label: 'Mantra', key: 'M', color: 'bg-mantra hover:bg-mantra/90' },
                    { type: 'journal' as const, label: 'Journal', key: 'J', color: 'bg-journal hover:bg-journal/90' },
                    { type: 'todo' as const, label: 'To-Do', key: 'T', color: 'bg-blue-500 hover:bg-blue-600' },
                    { type: 'vision' as const, label: 'Vision', key: 'V', color: 'bg-blue-600 hover:bg-blue-700' },
                    { type: 'schedule' as const, label: 'Schedule', key: 'S', color: 'bg-schedule hover:bg-schedule/90' },
                    { type: 'pep-talk' as const, label: 'Pep Talk', key: 'P', color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' },
                  ].map(({ type, label, key, color }) => (
                    <button
                      key={type}
                      onClick={() => setAddType(type)}
                      className={`${color} text-white py-4 px-4 rounded-xl font-medium transition-all flex items-center justify-between`}
                    >
                      <span>{label}</span>
                      <span className="text-white/60 text-sm font-mono">{key}</span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-gray-400 dark:text-slate-500 text-sm mt-4">
                  Press a key to quickly select
                </p>
              </>
            ) : (
              <>
                {/* Header with back button */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => {
                      setAddType(null)
                      setNewItemText('')
                      setNewItemDescription('')
                      setNewEventTitle('')
                      setNewEventDescription('')
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                    Add {addType === 'pep-talk' ? 'Pep Talk' : addType === 'todo' ? 'To-Do' : addType}
                  </h2>
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
                      setAddType(null)
                      setNewItemText('')
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Back
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
            ) : addType === 'schedule' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newEventTitle.trim() && !createEventMutation.isPending) {
                      e.preventDefault()
                      createEventMutation.mutate()
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-schedule"
                  placeholder="Event title..."
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-3">
                  <TimePicker
                    label="Start Time"
                    value={newEventStartTime}
                    onChange={(time) => {
                      setNewEventStartTime(time)
                      if (time >= newEventEndTime) {
                        const [h, m] = time.split(':').map(Number)
                        const newEndMinutes = (h * 60 + m + 30) % (24 * 60)
                        const newEndHours = Math.floor(newEndMinutes / 60)
                        const newEndMins = newEndMinutes % 60
                        setNewEventEndTime(
                          `${newEndHours.toString().padStart(2, '0')}:${newEndMins.toString().padStart(2, '0')}:00`
                        )
                      }
                    }}
                  />
                  <TimePicker
                    label="End Time"
                    value={newEventEndTime}
                    onChange={setNewEventEndTime}
                    minTime={newEventStartTime}
                  />
                </div>

                <input
                  type="text"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newEventTitle.trim() && !createEventMutation.isPending) {
                      e.preventDefault()
                      createEventMutation.mutate()
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-schedule"
                  placeholder="Description (optional)..."
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAddType(null)
                      setNewEventTitle('')
                      setNewEventDescription('')
                      setNewEventStartTime('09:00:00')
                      setNewEventEndTime('09:30:00')
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => createEventMutation.mutate()}
                    disabled={!newEventTitle.trim() || createEventMutation.isPending}
                    className="flex-1 py-3 bg-schedule hover:bg-schedule/90 disabled:bg-schedule/50 text-white rounded-lg font-medium transition-colors"
                  >
                    {createEventMutation.isPending ? 'Adding...' : 'Add Event'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {addType === 'vision' ? (
                  <div className="mb-3">
                    <RichTextEditor
                      content={newItemText}
                      onChange={setNewItemText}
                      placeholder="Your vision for the future..."
                    />
                  </div>
                ) : addType === 'mantra' ? (
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
                    placeholder={addType === 'habit' ? 'Habit name...' : addType === 'todo' ? 'What needs to be done?' : 'Journal prompt...'}
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
                      setAddType(null)
                      setNewItemText('')
                      setNewItemDescription('')
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Back
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Habit Detail Modal */}
      {selectedHabit && !showDeleteConfirm && !showMissNoteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedHabit(null)}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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

            {/* Show existing miss note if any */}
            {selectedHabit.missNote && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Missed - Action Plan:</p>
                <p className="text-sm text-red-500 dark:text-red-300 italic">{selectedHabit.missNote}</p>
                <button
                  onClick={() => deleteMissNoteMutation.mutate(selectedHabit.id)}
                  className="mt-2 text-xs text-red-400 hover:text-red-500 underline"
                >
                  Remove miss note
                </button>
              </div>
            )}

            <div className="space-y-3">
              {/* Mark as Missed button - only show if not already completed */}
              {!selectedHabit.completed && !selectedHabit.missNote && (
                <button
                  onClick={() => setShowMissNoteModal(true)}
                  className="w-full py-3 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Mark as Missed
                </button>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Habit
              </button>
            </div>

            <p className="text-sm text-gray-400 dark:text-slate-500 mt-3 text-center">
              Deleting removes this habit from today and future days only.
              Previous days will keep this habit.
            </p>
          </div>
        </div>
      )}

      {/* Miss Note Modal */}
      {showMissNoteModal && selectedHabit && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowMissNoteModal(false)
            setMissNoteText('')
          }}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mark as Missed</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-1">{selectedHabit.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowMissNoteModal(false)
                  setMissNoteText('')
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
              What will you do differently to make sure this doesn&apos;t happen again?
            </p>

            <textarea
              value={missNoteText}
              onChange={(e) => setMissNoteText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none mb-4"
              placeholder="e.g., Set a reminder for 8am, prepare the night before..."
              rows={3}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMissNoteModal(false)
                  setMissNoteText('')
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (missNoteText.trim()) {
                    createMissNoteMutation.mutate({
                      habitId: selectedHabit.id,
                      note: missNoteText.trim(),
                    })
                  }
                }}
                disabled={!missNoteText.trim() || createMissNoteMutation.isPending}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-medium transition-colors"
              >
                {createMissNoteMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedHabit && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowDeleteConfirm(false)
            setSelectedHabit(null)
          }}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMantra(null)}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Todo Detail Modal */}
      {selectedTodo && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTodo(null)}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">To-Do</h2>
              <button
                onClick={() => setSelectedTodo(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-slate-300 mb-6">{selectedTodo.text}</p>
            <button
              onClick={() => deleteTodoMutation.mutate(selectedTodo.id)}
              disabled={deleteTodoMutation.isPending}
              className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {deleteTodoMutation.isPending ? 'Deleting...' : 'Delete To-Do'}
            </button>
          </div>
        </div>
      )}

      {/* Vision Detail Modal */}
      {selectedVision && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setSelectedVision(null)
            setIsEditingVision(false)
            setEditVisionText('')
          }}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditingVision ? 'Edit Vision' : 'Vision'}
              </h2>
              <button
                onClick={() => {
                  setSelectedVision(null)
                  setIsEditingVision(false)
                  setEditVisionText('')
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            {isEditingVision ? (
              <>
                <RichTextEditor
                  content={editVisionText}
                  onChange={setEditVisionText}
                  placeholder="Your vision for the future..."
                  className="mb-4 [&_.ProseMirror]:min-h-[200px]"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditingVision(false)
                      setEditVisionText('')
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editVisionText.trim() && editVisionText !== '<p></p>') {
                        updateVisionMutation.mutate({ id: selectedVision.id, text: editVisionText })
                      }
                    }}
                    disabled={!editVisionText.trim() || editVisionText === '<p></p>' || updateVisionMutation.isPending}
                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {updateVisionMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="text-gray-600 dark:text-slate-300 mb-6 prose prose-sm dark:prose-invert max-w-none [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: selectedVision.text }}
                />
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setEditVisionText(selectedVision.text)
                      setIsEditingVision(true)
                    }}
                    className="w-full py-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-5 h-5" />
                    Edit Vision
                  </button>
                  <button
                    onClick={() => deleteVisionMutation.mutate(selectedVision.id)}
                    disabled={deleteVisionMutation.isPending}
                    className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    {deleteVisionMutation.isPending ? 'Deleting...' : 'Delete Vision'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Journal Prompt Detail Modal */}
      {selectedJournal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setSelectedJournal(null)
            setIsEditingJournal(false)
            setEditJournalText('')
            setEditJournalTemplate('')
          }}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Prompt</h2>
              <button
                onClick={() => {
                  setSelectedJournal(null)
                  setIsEditingJournal(false)
                  setEditJournalText('')
                  setEditJournalTemplate('')
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            {isEditingJournal ? (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Prompt
                  </label>
                  <input
                    type="text"
                    value={editJournalText}
                    onChange={(e) => setEditJournalText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-journal"
                    placeholder="Journal prompt..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Template (optional)
                  </label>
                  <textarea
                    value={editJournalTemplate}
                    onChange={(e) => setEditJournalTemplate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-journal resize-none"
                    placeholder="Pre-fill structure for entries (e.g., bullet points, sections)..."
                    rows={4}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    This text will pre-fill new journal entries to provide structure
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingJournal(false)
                      setEditJournalText(selectedJournal.prompt)
                      setEditJournalTemplate(selectedJournal.template_text || '')
                    }}
                    className="flex-1 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editJournalText.trim() && (editJournalText !== selectedJournal.prompt || editJournalTemplate !== (selectedJournal.template_text || ''))) {
                        updateJournalPromptMutation.mutate({
                          id: selectedJournal.id,
                          prompt: editJournalText,
                          templateText: editJournalTemplate
                        })
                      }
                    }}
                    disabled={!editJournalText.trim() || (editJournalText === selectedJournal.prompt && editJournalTemplate === (selectedJournal.template_text || '')) || updateJournalPromptMutation.isPending}
                    className="flex-1 py-2 bg-journal hover:bg-journal/90 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {updateJournalPromptMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-slate-300 mb-4">{selectedJournal.prompt}</p>
                <button
                  onClick={() => setIsEditingJournal(true)}
                  className="w-full py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-3"
                >
                  <Pencil className="w-5 h-5" />
                  Edit Prompt
                </button>
              </>
            )}

            <button
              onClick={() => deleteJournalPromptMutation.mutate(selectedJournal.id)}
              disabled={deleteJournalPromptMutation.isPending}
              className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {deleteJournalPromptMutation.isPending ? 'Deleting...' : 'Delete Prompt'}
            </button>
          </div>
        </div>
      )}

      {/* Schedule Add Modal (when clicking on grid) */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowScheduleModal(false)
            setNewEventTitle('')
            setNewEventDescription('')
            setNewEventStartTime('09:00:00')
            setNewEventEndTime('09:30:00')
          }}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Event</h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false)
                  setNewEventTitle('')
                  setNewEventDescription('')
                  setNewEventStartTime('09:00:00')
                  setNewEventEndTime('09:30:00')
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newEventTitle.trim() && !createEventMutation.isPending) {
                    e.preventDefault()
                    createEventMutation.mutate()
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-schedule"
                placeholder="Event title..."
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <TimePicker
                  label="Start Time"
                  value={newEventStartTime}
                  onChange={(time) => {
                    setNewEventStartTime(time)
                    if (time >= newEventEndTime) {
                      const [h, m] = time.split(':').map(Number)
                      const newEndMinutes = (h * 60 + m + 30) % (24 * 60)
                      const newEndHours = Math.floor(newEndMinutes / 60)
                      const newEndMins = newEndMinutes % 60
                      setNewEventEndTime(
                        `${newEndHours.toString().padStart(2, '0')}:${newEndMins.toString().padStart(2, '0')}:00`
                      )
                    }
                  }}
                />
                <TimePicker
                  label="End Time"
                  value={newEventEndTime}
                  onChange={setNewEventEndTime}
                  minTime={newEventStartTime}
                />
              </div>

              <input
                type="text"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newEventTitle.trim() && !createEventMutation.isPending) {
                    e.preventDefault()
                    createEventMutation.mutate()
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-schedule"
                placeholder="Description (optional)..."
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowScheduleModal(false)
                    setNewEventTitle('')
                    setNewEventDescription('')
                    setNewEventStartTime('09:00:00')
                    setNewEventEndTime('09:30:00')
                  }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createEventMutation.mutate()}
                  disabled={!newEventTitle.trim() || createEventMutation.isPending}
                  className="flex-1 py-3 bg-schedule hover:bg-schedule/90 disabled:bg-schedule/50 text-white rounded-lg font-medium transition-colors"
                >
                  {createEventMutation.isPending ? 'Adding...' : 'Add Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedEvent.title}
                </h2>
                <p className="text-schedule mt-1">
                  {(() => {
                    const formatTime = (timeStr: string) => {
                      const [hours, minutes] = timeStr.split(':').map(Number)
                      const period = hours >= 12 ? 'PM' : 'AM'
                      const displayHour = hours % 12 || 12
                      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
                    }
                    return `${formatTime(selectedEvent.start_time)} - ${formatTime(selectedEvent.end_time)}`
                  })()}
                </p>
                {selectedEvent.description && (
                  <p className="text-gray-500 dark:text-slate-400 mt-2">
                    {selectedEvent.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            <button
              onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
              disabled={deleteEventMutation.isPending}
              className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {deleteEventMutation.isPending ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
