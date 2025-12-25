'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, FileText, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { notesService } from '@/lib/services/notes'
import { RichTextEditor } from '@/components/RichTextEditor'
import type { Note } from '@/lib/types/database'

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom'

export default function NotesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => notesService.getNotes(user!.id),
    enabled: !!user,
  })

  // Close modals on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else if (isEditing) {
          setIsEditing(false)
          setSelectedNote(null)
        } else if (selectedNote) {
          setSelectedNote(null)
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDeleteConfirm, isEditing, selectedNote])

  const createNoteMutation = useMutation({
    mutationFn: () => notesService.createNote(user!.id, 'Untitled Note', ''),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setSelectedNote(newNote)
      setEditTitle(newNote.title)
      setEditContent(newNote.content)
      setIsEditing(true)
    },
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: { title?: string; content?: string } }) =>
      notesService.updateNote(noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
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

  const handleSave = () => {
    if (selectedNote) {
      updateNoteMutation.mutate({
        noteId: selectedNote.id,
        updates: { title: editTitle || 'Untitled Note', content: editContent },
      })
      setIsEditing(false)
      setSelectedNote(null)
    }
  }

  const openNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
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

  // Filter notes by date
  const filteredNotes = useMemo(() => {
    if (dateFilter === 'all') return notes

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
        if (!customStartDate || !customEndDate) return notes
        startDate = customStartDate
        endDate = new Date(customEndDate.getTime() + 24 * 60 * 60 * 1000)
        break
      default:
        return notes
    }

    return notes.filter((note) => {
      const noteDate = new Date(note.updated_at)
      return noteDate >= startDate && noteDate < endDate
    })
  }, [notes, dateFilter, customStartDate, customEndDate])

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
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Notes</h1>
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

      {/* Active filter indicator */}
      {dateFilter !== 'all' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </span>
          <button
            onClick={() => {
              setDateFilter('all')
              setCustomStartDate(null)
              setCustomEndDate(null)
            }}
            className="text-sm text-accent hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

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
            onClick={() => createNoteMutation.mutate()}
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
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-accent/50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {note.title || 'Untitled Note'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                {note.content ? stripHtml(note.content) : 'No content'}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                {formatDate(note.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-24 right-4">
        <button
          onClick={() => createNoteMutation.mutate()}
          disabled={createNoteMutation.isPending}
          className="w-14 h-14 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && selectedNote && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleSave}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={handleSave}
                className="text-accent font-medium"
              >
                Done
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-4 py-3 text-xl font-semibold bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none border-b border-gray-100 dark:border-slate-700"
            />

            {/* Content Editor */}
            <div className="flex-1 overflow-auto p-4">
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                placeholder="Start writing..."
                className="h-full [&_.ProseMirror]:min-h-[300px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedNote && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
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

      {/* Date Filter Modal */}
      {showDateFilter && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowDateFilter(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by date</h2>
              <button
                onClick={() => setShowDateFilter(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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
            <div className="border-t border-gray-200 dark:border-slate-700 p-4">
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
    </div>
  )
}
