'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, FileText } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { notesService } from '@/lib/services/notes'
import type { Note } from '@/lib/types/database'

export default function NotesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Notes</h1>
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
            onClick={() => createNoteMutation.mutate()}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
          >
            Create your first note
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNote(note)}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-accent/50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {note.title || 'Untitled Note'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2 whitespace-pre-wrap">
                {note.content || 'No content'}
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
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-xl"
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

            {/* Content Textarea */}
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Start writing..."
              className="flex-1 w-full px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none resize-none"
            />
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
    </div>
  )
}
