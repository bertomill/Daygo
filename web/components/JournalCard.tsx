'use client'

import { useState } from 'react'
import { BookOpen, Check, MoreHorizontal } from 'lucide-react'
import type { JournalPromptWithEntry } from '@/lib/types/database'

interface JournalCardProps {
  prompt: JournalPromptWithEntry
  onSave: (promptId: string, entry: string) => void
  onEdit?: (prompt: JournalPromptWithEntry) => void
}

export function JournalCard({ prompt, onSave, onEdit }: JournalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [entry, setEntry] = useState(prompt.todayEntry || '')

  const handleSave = () => {
    onSave(prompt.id, entry)
    setIsEditing(false)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(prompt)
  }

  return (
    <div className="bg-gradient-to-r from-journal/10 to-journal/5 dark:from-journal/20 dark:to-journal/10 border border-journal/30 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <BookOpen className="w-5 h-5 text-journal flex-shrink-0 mt-0.5" />
        <p className="text-gray-900 dark:text-white font-medium flex-1">{prompt.prompt}</p>
        <button
          onClick={handleOptionsClick}
          className="p-1 -m-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors flex-shrink-0"
          aria-label="Journal prompt options"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-400 dark:text-slate-500" />
        </button>
      </div>

      {isEditing ? (
        <div className="ml-8">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-journal resize-none"
            rows={3}
            placeholder="Write your reflection..."
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-journal hover:bg-journal/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEntry(prompt.todayEntry || '')
                setIsEditing(false)
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="ml-8 cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          {prompt.todayEntry ? (
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
              <p className="text-gray-700 dark:text-slate-300">{prompt.todayEntry}</p>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-slate-500 italic">Tap to write...</p>
          )}
        </div>
      )}
    </div>
  )
}
