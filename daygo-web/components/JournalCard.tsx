'use client'

import { useState } from 'react'
import { BookOpen, Check, MoreHorizontal } from 'lucide-react'
import type { JournalPromptWithEntry } from '@/lib/types/database'
import { RichTextEditor } from './RichTextEditor'

interface JournalCardProps {
  prompt: JournalPromptWithEntry
  onSave: (promptId: string, entry: string) => void
  onEdit?: (prompt: JournalPromptWithEntry) => void
}

export function JournalCard({ prompt, onSave, onEdit }: JournalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [entry, setEntry] = useState(prompt.todayEntry || prompt.template_text || '')

  const handleSave = () => {
    onSave(prompt.id, entry)
    setIsEditing(false)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(prompt)
  }

  return (
    <div className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5">
      <div className="flex items-start gap-4 mb-4">
        <BookOpen className="w-6 h-6 text-journal flex-shrink-0" />
        <p className="text-bevel-text dark:text-white font-semibold flex-1 leading-relaxed">{prompt.prompt}</p>
        <button
          onClick={handleOptionsClick}
          className="p-2 -m-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
          aria-label="Journal prompt options"
        >
          <MoreHorizontal className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
        </button>
      </div>

      {isEditing ? (
        <div className="ml-10">
          <RichTextEditor
            content={entry}
            onChange={setEntry}
            placeholder="Write your reflection..."
            className="w-full"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-journal hover:bg-journal/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-bevel-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEntry(prompt.todayEntry || prompt.template_text || '')
                setIsEditing(false)
              }}
              className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-bevel-text dark:text-white rounded-xl text-sm font-semibold transition-colors shadow-bevel-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="ml-10 cursor-pointer"
          onClick={() => {
            setEntry(prompt.todayEntry || prompt.template_text || '')
            setIsEditing(true)
          }}
        >
          {prompt.todayEntry ? (
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-bevel-green flex-shrink-0 mt-0.5" />
              <div
                className="text-bevel-text dark:text-slate-200 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1"
                dangerouslySetInnerHTML={{ __html: prompt.todayEntry }}
              />
            </div>
          ) : (
            <p className="text-bevel-text-secondary dark:text-slate-400 italic">Tap to write...</p>
          )}
        </div>
      )}
    </div>
  )
}
