'use client'

import { useState } from 'react'
import { CheckSquare, Target, MoreVertical, GripVertical, Flag, Play, Square, Clock, Circle, CheckCircle2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KanbanCardWithDetails } from '@/lib/types/database'

interface KanbanCardProps {
  card: KanbanCardWithDetails
  onClick: () => void
  onPriorityChange?: (cardId: string, priority: number | null) => void
  onTimerToggle?: (cardId: string, isActive: boolean) => void
  onComplete?: (cardId: string, isDone: boolean) => void
  usedPriorities?: number[] // Which priorities (1, 2, 3) are already in use
}

const TAG_COLORS = [
  'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 ring-1 ring-blue-200/50 dark:ring-blue-400/20',
  'bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300 ring-1 ring-violet-200/50 dark:ring-violet-400/20',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-200/50 dark:ring-emerald-400/20',
  'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-200/50 dark:ring-amber-400/20',
  'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-rose-200/50 dark:ring-rose-400/20',
  'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300 ring-1 ring-cyan-200/50 dark:ring-cyan-400/20',
]

function getTagColor(tag: string, index: number): string {
  // Use a simple hash to get consistent colors for the same tag
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return TAG_COLORS[hash % TAG_COLORS.length]
}

// Priority badge colors (for the number circle)
const PRIORITY_BADGE_COLORS = {
  1: 'bg-gradient-to-b from-amber-400 to-amber-500 text-white',
  2: 'bg-gradient-to-b from-slate-400 to-slate-500 text-white',
  3: 'bg-gradient-to-b from-orange-500 to-orange-600 text-white',
}

// Priority card styles (border + background tint)
const PRIORITY_CARD_STYLES = {
  1: 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/30 dark:to-slate-800 ring-1 ring-amber-200 dark:ring-amber-800/50',
  2: 'border-l-4 border-l-slate-400 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700/60 dark:to-slate-800 ring-1 ring-slate-200 dark:ring-slate-600/50',
  3: 'border-l-4 border-l-orange-600 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/30 dark:to-slate-800 ring-1 ring-orange-200 dark:ring-orange-800/50',
}

// Default card style (no priority)
const DEFAULT_CARD_STYLE = 'bg-white dark:bg-slate-800 ring-1 ring-gray-200/80 dark:ring-slate-700/80'

function formatTime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function KanbanCard({ card, onClick, onPriorityChange, onTimerToggle, onComplete, usedPriorities = [] }: KanbanCardProps) {
  const [showPriorityPicker, setShowPriorityPicker] = useState(false)
  const completedSubtasks = card.subtasks.filter((s) => s.completed).length
  const totalSubtasks = card.subtasks.length

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onPriorityChange) return

    // If card already has priority, clear it
    if (card.priority !== null) {
      onPriorityChange(card.id, null)
    } else {
      // Show the priority picker
      setShowPriorityPicker(true)
    }
  }

  const handlePrioritySelect = (priority: number) => {
    if (!onPriorityChange) return
    onPriorityChange(card.id, priority)
    setShowPriorityPicker(false)
  }

  // Get available priorities (not used by other cards, or already this card's priority)
  const availablePriorities = [1, 2, 3].filter(
    p => !usedPriorities.includes(p) || card.priority === p
  )

  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onTimerToggle) return

    const isActive = !!card.activeTimer
    onTimerToggle(card.id, isActive)
  }

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onComplete) return

    const isDone = card.status === 'done'
    onComplete(card.id, isDone)
  }

  const isTimerActive = !!card.activeTimer
  const totalTime = card.totalTimeSpent || 0
  const isDone = card.status === 'done'

  // Determine card styles based on priority
  const hasPriority = card.priority !== null && card.priority >= 1 && card.priority <= 3
  const priorityCardStyle = hasPriority
    ? PRIORITY_CARD_STYLES[card.priority as 1 | 2 | 3]
    : DEFAULT_CARD_STYLE

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group relative ${priorityCardStyle} ${
        isDragging ? 'opacity-60 scale-105 shadow-xl rotate-2' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 -mt-0.5 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {onComplete && (
                <button
                  onClick={handleCompleteClick}
                  className="flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 drop-shadow-sm" fill="currentColor" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 dark:text-slate-600 hover:text-green-500 dark:hover:text-green-400" strokeWidth={2} />
                  )}
                </button>
              )}
              {/* Priority badge/picker */}
              <div className="relative flex-shrink-0">
                {hasPriority ? (
                  <button
                    onClick={handlePriorityClick}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm ${
                      PRIORITY_BADGE_COLORS[card.priority as 1 | 2 | 3]
                    }`}
                    title={`Priority ${card.priority} (click to remove)`}
                  >
                    {card.priority}
                  </button>
                ) : onPriorityChange && availablePriorities.length > 0 ? (
                  <button
                    onClick={handlePriorityClick}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium border-2 border-dashed border-gray-200 dark:border-slate-600 text-gray-300 dark:text-slate-500 hover:border-accent dark:hover:border-accent hover:text-accent transition-all duration-200"
                    title="Set priority (1-3)"
                  >
                    +
                  </button>
                ) : null}

                {/* Priority picker dropdown */}
                {showPriorityPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowPriorityPicker(false)
                      }}
                    />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1.5 flex gap-1.5">
                      {[1, 2, 3].map((p) => {
                        const isAvailable = availablePriorities.includes(p)
                        return (
                          <button
                            key={p}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isAvailable) handlePrioritySelect(p)
                            }}
                            disabled={!isAvailable}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                              isAvailable
                                ? `${PRIORITY_BADGE_COLORS[p as 1 | 2 | 3]} hover:scale-110 active:scale-95 cursor-pointer shadow-sm`
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-slate-600 cursor-not-allowed'
                            }`}
                            title={isAvailable ? `Set as priority ${p}` : `Priority ${p} already in use`}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
              {card.high_priority && (
                <Flag className="w-3.5 h-3.5 text-red-500 flex-shrink-0 drop-shadow-sm" fill="currentColor" />
              )}
              <h4
                onClick={onClick}
                className={`font-semibold text-sm cursor-pointer leading-snug ${
                  isDone
                    ? 'text-gray-400 dark:text-slate-500 line-through decoration-gray-300 dark:decoration-slate-600'
                    : 'text-gray-800 dark:text-gray-100'
                }`}
              >
                {card.title}
              </h4>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all flex-shrink-0"
            >
              <MoreVertical className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            </button>
          </div>

          {card.description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-2 leading-relaxed">
              {card.description}
            </p>
          )}

          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {card.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(tag, index)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50">
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                <CheckSquare className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}

            {card.goal && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent dark:bg-accent/20 px-2.5 py-1 rounded-full font-medium">
                <Target className="w-3 h-3" />
                {card.goal.title}
              </span>
            )}

            {onTimerToggle && (
              <div className="flex items-center gap-2 ml-auto">
                {totalTime > 0 && (
                  <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 font-medium tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(totalTime)}
                  </span>
                )}
                <button
                  onClick={handleTimerClick}
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow active:scale-95 ${
                    isTimerActive
                      ? 'bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                      : 'bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  }`}
                  title={isTimerActive ? 'Stop timer' : 'Start timer'}
                >
                  {isTimerActive ? (
                    <Square className="w-3 h-3" fill="currentColor" />
                  ) : (
                    <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
