'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  BookOpen,
  Check,
  MoreHorizontal,
  Heart,
  Star,
  Target,
  Lightbulb,
  Flame,
  Trophy,
  Compass,
  Brain,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Cloud,
  Smile,
  Pen,
  type LucideIcon
} from 'lucide-react'
import type { JournalPromptWithEntry } from '@/lib/types/database'
import { RichTextEditor } from './RichTextEditor'

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'heart': Heart,
  'star': Star,
  'target': Target,
  'lightbulb': Lightbulb,
  'flame': Flame,
  'trophy': Trophy,
  'compass': Compass,
  'brain': Brain,
  'sparkles': Sparkles,
  'zap': Zap,
  'sun': Sun,
  'moon': Moon,
  'cloud': Cloud,
  'smile': Smile,
  'pen': Pen,
}

export const JOURNAL_ICON_OPTIONS = Object.keys(iconMap)

// Color options with their display values
export const JOURNAL_COLOR_OPTIONS: { name: string; value: string; bg: string; bgHover: string }[] = [
  { name: 'orange', value: '#E97451', bg: 'bg-[#E97451]', bgHover: 'hover:bg-[#d4673f]' },
  { name: 'red', value: '#EF4444', bg: 'bg-red-500', bgHover: 'hover:bg-red-600' },
  { name: 'pink', value: '#EC4899', bg: 'bg-pink-500', bgHover: 'hover:bg-pink-600' },
  { name: 'purple', value: '#8B5CF6', bg: 'bg-violet-500', bgHover: 'hover:bg-violet-600' },
  { name: 'blue', value: '#3B82F6', bg: 'bg-blue-500', bgHover: 'hover:bg-blue-600' },
  { name: 'cyan', value: '#06B6D4', bg: 'bg-cyan-500', bgHover: 'hover:bg-cyan-600' },
  { name: 'teal', value: '#14B8A6', bg: 'bg-teal-500', bgHover: 'hover:bg-teal-600' },
  { name: 'green', value: '#22C55E', bg: 'bg-green-500', bgHover: 'hover:bg-green-600' },
  { name: 'yellow', value: '#EAB308', bg: 'bg-yellow-500', bgHover: 'hover:bg-yellow-600' },
  { name: 'slate', value: '#64748B', bg: 'bg-slate-500', bgHover: 'hover:bg-slate-600' },
]

// Default journal color (orange)
const DEFAULT_COLOR = '#E97451'

interface SortableJournalCardProps {
  prompt: JournalPromptWithEntry
  onSave: (promptId: string, entry: string) => void
  onEdit?: (prompt: JournalPromptWithEntry) => void
}

export function SortableJournalCard({ prompt, onSave, onEdit }: SortableJournalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [entry, setEntry] = useState(prompt.todayEntry || prompt.template_text || '')

  const promptColor = prompt.color || DEFAULT_COLOR

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prompt.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
  }

  const handleSave = () => {
    onSave(prompt.id, entry)
    setIsEditing(false)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(prompt)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5 ${
        isDragging ? 'opacity-50 shadow-bevel-lg scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 text-bevel-text-secondary dark:text-slate-400 hover:text-bevel-text dark:hover:text-slate-200 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {(() => {
          const IconComponent = iconMap[prompt.icon || 'book-open'] || BookOpen
          return <IconComponent className="w-6 h-6 flex-shrink-0" style={{ color: promptColor }} />
        })()}
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
        <div className="-mx-5 -mb-5 px-2 pb-3">
          <RichTextEditor
            content={entry}
            onChange={setEntry}
            placeholder="Write your reflection..."
            className="w-full"
          />
          <div className="flex gap-2 mt-3 px-1">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors shadow-bevel-sm"
              style={{ backgroundColor: promptColor }}
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
          className="ml-14 cursor-pointer"
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
