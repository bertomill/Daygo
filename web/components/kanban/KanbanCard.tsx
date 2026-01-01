'use client'

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
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
]

function getTagColor(tag: string, index: number): string {
  // Use a simple hash to get consistent colors for the same tag
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return TAG_COLORS[hash % TAG_COLORS.length]
}

const PRIORITY_COLORS = {
  1: 'bg-red-500 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-500 text-white',
  4: 'bg-blue-500 text-white',
  5: 'bg-gray-500 text-white',
}

function formatTime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function KanbanCard({ card, onClick, onPriorityChange, onTimerToggle, onComplete }: KanbanCardProps) {
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

    // Cycle through priorities: null -> 1 -> 2 -> 3 -> 4 -> 5 -> null
    const nextPriority = card.priority === null ? 1 : card.priority === 5 ? null : card.priority + 1
    onPriorityChange(card.id, nextPriority)
  }

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 dark:bg-slate-700 rounded-lg p-3 hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-600 group relative ${
        isDragging ? 'opacity-50 scale-105' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none p-0.5 -ml-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {onComplete && (
                <button
                  onClick={handleCompleteClick}
                  className="flex-shrink-0 transition-all hover:scale-110"
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" fill="currentColor" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 dark:text-slate-500 hover:text-green-500 dark:hover:text-green-400" />
                  )}
                </button>
              )}
              {card.priority && (
                <button
                  onClick={handlePriorityClick}
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                    PRIORITY_COLORS[card.priority as keyof typeof PRIORITY_COLORS]
                  }`}
                  title={`Priority ${card.priority} (click to change)`}
                >
                  {card.priority}
                </button>
              )}
              {!card.priority && onPriorityChange && (
                <button
                  onClick={handlePriorityClick}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-600 dark:hover:text-slate-300 transition-all"
                  title="Set priority (1-5)"
                >
                  +
                </button>
              )}
              {card.high_priority && (
                <Flag className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" />
              )}
              <h4
                onClick={onClick}
                className={`font-medium text-sm cursor-pointer ${
                  isDone
                    ? 'text-gray-500 dark:text-slate-500 line-through'
                    : 'text-gray-900 dark:text-white'
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
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-all flex-shrink-0"
            >
              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {card.description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-1">
              {card.description}
            </p>
          )}

          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-0.5 rounded ${getTagColor(tag, index)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300">
                <CheckSquare className="w-3 h-3" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}

            {card.goal && (
              <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent dark:bg-accent/20 px-2 py-0.5 rounded">
                <Target className="w-3 h-3" />
                {card.goal.title}
              </span>
            )}

            {onTimerToggle && (
              <div className="flex items-center gap-1 ml-auto">
                {totalTime > 0 && (
                  <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(totalTime)}
                  </span>
                )}
                <button
                  onClick={handleTimerClick}
                  className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all ${
                    isTimerActive
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                  title={isTimerActive ? 'Stop timer' : 'Start timer'}
                >
                  {isTimerActive ? (
                    <Square className="w-3 h-3" fill="currentColor" />
                  ) : (
                    <Play className="w-3 h-3" fill="currentColor" />
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
