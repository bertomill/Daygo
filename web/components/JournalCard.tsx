'use client'

import { useState } from 'react'
import { BookOpen, Check } from 'lucide-react'
import type { JournalPromptWithEntry } from '../../src/types/database'

interface JournalCardProps {
  prompt: JournalPromptWithEntry
  onSave: (promptId: string, entry: string) => void
}

export function JournalCard({ prompt, onSave }: JournalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [entry, setEntry] = useState(prompt.todayEntry || '')

  const handleSave = () => {
    onSave(prompt.id, entry)
    setIsEditing(false)
  }

  return (
    <div className="bg-gradient-to-r from-journal/20 to-journal/10 border border-journal/30 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <BookOpen className="w-5 h-5 text-journal flex-shrink-0 mt-0.5" />
        <p className="text-white font-medium">{prompt.prompt}</p>
      </div>

      {isEditing ? (
        <div className="ml-8">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-journal resize-none"
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
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
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
              <p className="text-slate-300">{prompt.todayEntry}</p>
            </div>
          ) : (
            <p className="text-slate-500 italic">Tap to write...</p>
          )}
        </div>
      )}
    </div>
  )
}
