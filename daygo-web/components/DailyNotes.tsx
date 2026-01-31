'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'

interface DailyNotesProps {
  note: string
  onSave: (note: string) => void
  isSaving?: boolean
}

export function DailyNotes({ note, onSave, isSaving }: DailyNotesProps) {
  const [localNote, setLocalNote] = useState(note)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setLocalNote(note)
  }, [note])

  const handleBlur = () => {
    if (localNote !== note) {
      onSave(localNote)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
  }

  return (
    <div className="mb-3">
      {isEditing ? (
        <textarea
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="What's going to make this the best day of your life?"
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          rows={2}
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-start gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-left transition-colors"
        >
          <FileText className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
          {localNote ? (
            <span className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
              {localNote}
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-slate-500 italic">
              What&apos;s going to make this the best day of your life?
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-gray-400 ml-auto">Saving...</span>
          )}
        </button>
      )}
    </div>
  )
}
