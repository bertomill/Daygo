'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, FileText, Calendar, ChevronLeft, ChevronRight, PenTool, MoreVertical, Tag, Star, MessageCircle, Send, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { notesService, type NoteType } from '@/lib/services/notes'
import { RichTextEditor } from '@/components/RichTextEditor'
import { CanvasEditor, type CanvasEditorHandle } from '@/components/CanvasEditor'
import type { Note } from '@/lib/types/database'

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom'

export default function NotesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCanvasData, setEditCanvasData] = useState<Record<string, unknown> | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [showNoteTypeModal, setShowNoteTypeModal] = useState(false)
  const [menuOpenForNote, setMenuOpenForNote] = useState<string | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const canvasEditorRef = useRef<CanvasEditorHandle>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isNewNote, setIsNewNote] = useState(false)
  const [editTags, setEditTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)
  const [showStarredOnly, setShowStarredOnly] = useState(false)

  // Tag suggestion state
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSuggestingTags, setIsSuggestingTags] = useState(false)
  const [lastSavedNoteId, setLastSavedNoteId] = useState<string | null>(null)

  // Chat state
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => notesService.getNotes(user!.id),
    enabled: !!user,
  })

  const { data: allTags = [] } = useQuery({
    queryKey: ['notes-tags', user?.id],
    queryFn: () => notesService.getAllTags(user!.id),
    enabled: !!user,
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+N or Ctrl+N to open new note modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !isEditing && !selectedNote) {
        e.preventDefault()
        setShowNoteTypeModal(true)
        return
      }

      // Don't trigger shortcuts if typing in an input or editing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || isEditing) {
        return
      }

      if (e.key === 'Escape') {
        if (menuOpenForNote) {
          setMenuOpenForNote(null)
        } else if (noteToDelete) {
          setNoteToDelete(null)
        } else if (showNoteTypeModal) {
          setShowNoteTypeModal(false)
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else if (isEditing) {
          handleSave()
        } else if (selectedNote) {
          setSelectedNote(null)
        }
      } else if (e.key.toLowerCase() === 'c' && !isEditing && !selectedNote && !showNoteTypeModal) {
        // Create canvas note with 'C' key
        e.preventDefault()
        setShowNoteTypeModal(false)
        // Use a small timeout to ensure state is updated
        setTimeout(() => {
          const button = document.querySelector('[data-note-type="canvas"]') as HTMLButtonElement
          button?.click()
        }, 0)
      } else if (e.key.toLowerCase() === 't' && !isEditing && !selectedNote && !showNoteTypeModal) {
        // Create text note with 'T' key
        e.preventDefault()
        setShowNoteTypeModal(false)
        // Use a small timeout to ensure state is updated
        setTimeout(() => {
          const button = document.querySelector('[data-note-type="text"]') as HTMLButtonElement
          button?.click()
        }, 0)
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [menuOpenForNote, noteToDelete, showNoteTypeModal, showDeleteConfirm, isEditing, selectedNote])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpenForNote) {
        setMenuOpenForNote(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpenForNote])

  // Auto-focus title input for new notes
  useEffect(() => {
    if (isEditing && isNewNote && titleInputRef.current) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      }, 100)
      setIsNewNote(false)
    }
  }, [isEditing, isNewNote])

  const createNoteMutation = useMutation({
    mutationFn: (noteType: NoteType) =>
      notesService.createNote(
        user!.id,
        noteType === 'canvas' ? 'Untitled Canvas' : 'Untitled Note',
        '',
        noteType,
        noteType === 'canvas' ? {} : undefined
      ),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setSelectedNote(newNote)
      setEditTitle(newNote.title)
      setEditContent(newNote.content)
      setEditCanvasData(newNote.canvas_data)
      setIsEditing(true)
      setIsNewNote(true)
      setShowNoteTypeModal(false)
    },
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({
      noteId,
      updates,
    }: {
      noteId: string
      updates: { title?: string; content?: string; canvas_data?: Record<string, unknown>; tags?: string[] }
    }) => notesService.updateNote(noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes-tags'] })
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setSelectedNote(null)
      setShowDeleteConfirm(false)
      setIsEditing(false)
    },
  })

  const toggleStarMutation = useMutation({
    mutationFn: ({ noteId, isStarred }: { noteId: string; isStarred: boolean }) =>
      notesService.toggleStar(noteId, isStarred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const fetchTagSuggestions = useCallback(async (title: string, content: string, currentTags: string[], allUserTags: string[]) => {
    setIsSuggestingTags(true)
    try {
      const response = await fetch('/api/notes-suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          existingTags: currentTags,
          allTags: allUserTags,
        }),
      })
      if (response.ok) {
        const { suggestedTags: tags } = await response.json()
        if (tags && tags.length > 0) {
          setSuggestedTags(tags)
          setShowSuggestions(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tag suggestions:', error)
    } finally {
      setIsSuggestingTags(false)
    }
  }, [])

  const handleSave = useCallback(() => {
    if (selectedNote) {
      const isCanvas = selectedNote.note_type === 'canvas'
      let canvasData = editCanvasData

      // Get current canvas data from ref if it's a canvas note
      if (isCanvas && canvasEditorRef.current) {
        const sceneData = canvasEditorRef.current.getSceneData()
        if (sceneData) {
          canvasData = sceneData
        }
      }

      const savedTitle = editTitle || (isCanvas ? 'Untitled Canvas' : 'Untitled Note')
      const savedContent = editContent
      const savedTags = [...editTags]

      updateNoteMutation.mutate({
        noteId: selectedNote.id,
        updates: {
          title: savedTitle,
          content: savedContent,
          tags: savedTags,
          ...(isCanvas && canvasData ? { canvas_data: canvasData } : {}),
        },
      })

      // Fetch tag suggestions in background (only for text notes with content)
      const noteId = selectedNote.id
      if (!isCanvas && (savedContent || savedTitle)) {
        setLastSavedNoteId(noteId)
        fetchTagSuggestions(savedTitle, savedContent, savedTags, allTags)
      }

      setIsEditing(false)
      setSelectedNote(null)
      setEditCanvasData(null)
    }
  }, [selectedNote, editTitle, editContent, editCanvasData, editTags, allTags, updateNoteMutation, fetchTagSuggestions])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Focus chat input when opened
  useEffect(() => {
    if (showChat) {
      setTimeout(() => chatInputRef.current?.focus(), 100)
    }
  }, [showChat])

  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || isChatLoading || !user) return

    const userMessage = { role: 'user' as const, content: chatInput.trim() }
    const newMessages = [...chatMessages, userMessage]
    setChatMessages(newMessages)
    setChatInput('')
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/notes-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userId: user.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let assistantContent = ''

      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        assistantContent += text
        setChatMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
          return updated
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setIsChatLoading(false)
    }
  }, [chatInput, chatMessages, isChatLoading, user])

  const applySuggestedTag = useCallback((tag: string) => {
    if (!lastSavedNoteId) return
    const note = notes.find((n) => n.id === lastSavedNoteId)
    if (!note) return

    const newTags = [...(note.tags || []), tag]
    updateNoteMutation.mutate({
      noteId: lastSavedNoteId,
      updates: { tags: newTags },
    })
    setSuggestedTags((prev) => prev.filter((t) => t !== tag))
    if (suggestedTags.length <= 1) {
      setShowSuggestions(false)
    }
  }, [lastSavedNoteId, notes, suggestedTags.length, updateNoteMutation])

  const openNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditCanvasData(note.canvas_data)
    setEditTags(note.tags || [])
    setTagInput('')
    setIsEditing(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  // Strip HTML tags for preview (SSR-safe)
  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') {
      // Simple regex fallback for SSR
      return html.replace(/<[^>]*>/g, '')
    }
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Filter notes by date, tag, and starred
  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Apply starred filter
    if (showStarredOnly) {
      filtered = filtered.filter((note) => note.is_starred)
    }

    // Apply tag filter
    if (selectedTagFilter) {
      filtered = filtered.filter((note) => note.tags?.includes(selectedTagFilter))
    }

    // Apply date filter
    if (dateFilter === 'all') return filtered

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let startDate: Date
    let endDate: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow

    switch (dateFilter) {
      case 'today':
        startDate = startOfToday
        break
      case 'week':
        startDate = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (!customStartDate || !customEndDate) return filtered
        startDate = customStartDate
        endDate = new Date(customEndDate.getTime() + 24 * 60 * 60 * 1000)
        break
      default:
        return filtered
    }

    return filtered.filter((note) => {
      const noteDate = new Date(note.updated_at)
      return noteDate >= startDate && noteDate < endDate
    })
  }, [notes, dateFilter, customStartDate, customEndDate, selectedTagFilter, showStarredOnly])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const isInRange = (date: Date) => {
    if (!customStartDate || !customEndDate) return false
    return date >= customStartDate && date <= customEndDate
  }

  const isStartOrEnd = (date: Date) => {
    if (!date) return false
    return (
      (customStartDate && date.toDateString() === customStartDate.toDateString()) ||
      (customEndDate && date.toDateString() === customEndDate.toDateString())
    )
  }

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      setCustomStartDate(date)
      setCustomEndDate(null)
      setSelectingStart(false)
    } else {
      if (date < customStartDate!) {
        setCustomStartDate(date)
        setCustomEndDate(customStartDate)
      } else {
        setCustomEndDate(date)
      }
      setSelectingStart(true)
    }
  }

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'all': return 'All time'
      case 'today': return 'Today'
      case 'week': return 'Last 7 days'
      case 'month': return 'Last 30 days'
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${formatDate(customStartDate.toISOString())} - ${formatDate(customEndDate.toISOString())}`
        }
        return 'Custom'
      default: return 'All time'
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen bg-bevel-bg dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bevel-text dark:text-white">Notes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setShowDateFilter(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              dateFilter === 'all'
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                : 'bg-accent/10 text-accent'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {getFilterLabel()}
          </button>
        </div>
      </div>

      {/* Active filter indicator */}
      {(dateFilter !== 'all' || selectedTagFilter || showStarredOnly) && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </span>
          <button
            onClick={() => {
              setDateFilter('all')
              setCustomStartDate(null)
              setCustomEndDate(null)
              setSelectedTagFilter(null)
              setShowStarredOnly(false)
            }}
            className="text-sm text-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Tag Suggestions Banner */}
      {(showSuggestions && suggestedTags.length > 0) && (
        <div className="mb-4 p-3 bg-accent/5 border border-accent/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-accent">Suggested tags</span>
            <button
              onClick={() => { setShowSuggestions(false); setSuggestedTags([]) }}
              className="p-1 hover:bg-accent/10 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-accent" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => applySuggestedTag(tag)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-accent/30 text-accent text-sm rounded-full hover:bg-accent/10 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSuggestingTags && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          Analyzing note for tag suggestions...
        </div>
      )}

      {/* Starred and Tag filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            showStarredOnly
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${showStarredOnly ? 'fill-current' : ''}`} />
          Starred
        </button>
        {allTags.length > 0 && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
            <button
              onClick={() => setSelectedTagFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedTagFilter
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
          </>
        )}
        {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTagFilter === tag
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 mb-4">No notes yet</p>
          <button
            onClick={() => setShowNoteTypeModal(true)}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
          >
            Create your first note
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 mb-4">No notes in this date range</p>
          <button
            onClick={() => {
              setDateFilter('all')
              setCustomStartDate(null)
              setCustomEndDate(null)
            }}
            className="text-accent hover:underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNote(note)}
              className="bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 cursor-pointer hover:shadow-bevel-md transition-all shadow-bevel"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-bevel-sm ${
                    note.note_type === 'canvas'
                      ? 'bg-purple-100 dark:bg-purple-500/20'
                      : 'bg-blue-100 dark:bg-blue-500/20'
                  }`}
                >
                  {note.note_type === 'canvas' ? (
                    <PenTool className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-bevel-text dark:text-white truncate">
                    {note.title || (note.note_type === 'canvas' ? 'Untitled Canvas' : 'Untitled Note')}
                  </h3>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400 mt-1.5 line-clamp-2">
                    {note.note_type === 'canvas'
                      ? 'Freeform canvas'
                      : note.content
                      ? stripHtml(note.content)
                      : 'No content'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {formatDate(note.updated_at)}
                    </p>
                    {note.tags && note.tags.length > 0 && (
                      <>
                        <span className="text-gray-300 dark:text-slate-600">•</span>
                        {note.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs rounded-full"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Star and Menu Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStarMutation.mutate({ noteId: note.id, isStarred: !note.is_starred })
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        note.is_starred
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-400 dark:text-slate-500'
                      }`}
                    />
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenForNote(menuOpenForNote === note.id ? null : note.id)
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                    </button>
                  {/* Dropdown Menu */}
                  {menuOpenForNote === note.id && (
                    <div
                      className="absolute right-0 top-8 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg py-1 z-10 min-w-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setMenuOpenForNote(null)
                          setNoteToDelete(note)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-24 right-4">
        <button
          onClick={() => setShowNoteTypeModal(true)}
          disabled={createNoteMutation.isPending}
          className="w-14 h-14 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Note Type Selection Modal */}
      {showNoteTypeModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowNoteTypeModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Note
            </h2>
            <div className="space-y-3">
              <button
                data-note-type="text"
                onClick={() => createNoteMutation.mutate('text')}
                disabled={createNoteMutation.isPending}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors border border-blue-100 dark:border-blue-800"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Text Note</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Rich text with formatting
                  </p>
                </div>
                <kbd className="px-2.5 py-1 text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md">
                  T
                </kbd>
              </button>

              <button
                data-note-type="canvas"
                onClick={() => createNoteMutation.mutate('canvas')}
                disabled={createNoteMutation.isPending}
                className="w-full flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl transition-colors border border-purple-100 dark:border-purple-800"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/50 rounded-xl flex items-center justify-center">
                  <PenTool className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Canvas Note</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Freeform drawing & shapes
                  </p>
                </div>
                <kbd className="px-2.5 py-1 text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md">
                  C
                </kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && selectedNote && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleSave}
        >
          <div
            className={`bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl flex flex-col shadow-2xl ${
              selectedNote.note_type === 'canvas'
                ? 'w-full h-full max-w-none m-0 rounded-none sm:rounded-2xl sm:m-4 sm:w-[95vw] sm:h-[90vh]'
                : 'w-full max-w-2xl h-[80vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
              <button onClick={handleSave} className="text-accent font-medium">
                Done
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* Title Input */}
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={selectedNote.note_type === 'canvas' ? 'Canvas title...' : 'Note title...'}
              className="w-full px-4 py-3 text-xl font-semibold bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none border-b border-white/20 dark:border-white/10"
            />

            {/* Tags Input */}
            <div className="px-4 py-3 border-b border-white/20 dark:border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                {editTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                      className="hover:bg-accent/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const newTag = tagInput.trim().toLowerCase()
                      if (newTag && !editTags.includes(newTag)) {
                        setEditTags([...editTags, newTag])
                      }
                      setTagInput('')
                    } else if (e.key === 'Backspace' && !tagInput && editTags.length > 0) {
                      setEditTags(editTags.slice(0, -1))
                    }
                  }}
                  placeholder={editTags.length === 0 ? 'Add tags...' : ''}
                  className="flex-1 min-w-[100px] bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Content Editor - Conditional based on note type */}
            {selectedNote.note_type === 'canvas' ? (
              <div style={{ flex: 1, minHeight: 0, height: '100%' }}>
                <CanvasEditor
                  ref={canvasEditorRef}
                  initialData={editCanvasData as any}
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-4">
                <RichTextEditor
                  content={editContent}
                  onChange={setEditContent}
                  placeholder=""
                  className="h-full [&_.ProseMirror]:min-h-[300px]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (from editor) */}
      {showDeleteConfirm && selectedNote && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete note?</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteNoteMutation.mutate(selectedNote.id)}
                disabled={deleteNoteMutation.isPending}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (from list) */}
      {noteToDelete && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setNoteToDelete(null)}
        >
          <div
            className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete note?</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              &ldquo;{noteToDelete.title || 'Untitled Note'}&rdquo; will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setNoteToDelete(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteNoteMutation.mutate(noteToDelete.id)
                  setNoteToDelete(null)
                }}
                disabled={deleteNoteMutation.isPending}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Modal */}
      {showDateFilter && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowDateFilter(false)}
        >
          <div
            className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by date</h2>
              <button
                onClick={() => setShowDateFilter(false)}
                className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            {/* Quick Filters */}
            <div className="p-4 space-y-2">
              {[
                { value: 'all' as DateFilter, label: 'All time' },
                { value: 'today' as DateFilter, label: 'Today' },
                { value: 'week' as DateFilter, label: 'Last 7 days' },
                { value: 'month' as DateFilter, label: 'Last 30 days' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDateFilter(option.value)
                    setCustomStartDate(null)
                    setCustomEndDate(null)
                    setShowDateFilter(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                    dateFilter === option.value
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="border-t border-white/20 dark:border-white/10 p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">Custom range</p>

              {/* Selected Range Display */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  selectingStart && dateFilter === 'custom'
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200 dark:border-slate-700'
                }`}>
                  {customStartDate ? formatDate(customStartDate.toISOString()) : 'Start date'}
                </div>
                <span className="text-gray-400">-</span>
                <div className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  !selectingStart && dateFilter === 'custom'
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200 dark:border-slate-700'
                }`}>
                  {customEndDate ? formatDate(customEndDate.toISOString()) : 'End date'}
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                  </button>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-400 dark:text-slate-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(calendarMonth).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />
                    }

                    const isToday = date.toDateString() === new Date().toDateString()
                    const inRange = isInRange(date)
                    const isEndpoint = isStartOrEnd(date)

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          handleDateClick(date)
                          setDateFilter('custom')
                        }}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                          isEndpoint
                            ? 'bg-accent text-white font-medium'
                            : inRange
                            ? 'bg-accent/20 text-accent'
                            : isToday
                            ? 'border border-accent text-accent'
                            : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Apply Button */}
              {customStartDate && customEndDate && (
                <button
                  onClick={() => {
                    setDateFilter('custom')
                    setShowDateFilter(false)
                  }}
                  className="w-full mt-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Chat Drawer */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
          >
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              </button>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Talk to your notes</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Ask questions about your notes</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Ask me anything about your notes</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">
                    I can search by tags, find topics, and summarize your notes
                  </p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-md'
                    }`}
                  >
                    {msg.content || (isChatLoading && i === chatMessages.length - 1 ? (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : '')}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  placeholder="Ask about your notes..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
