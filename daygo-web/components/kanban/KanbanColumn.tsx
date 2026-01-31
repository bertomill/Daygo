'use client'

import { useState } from 'react'
import { MoreVertical, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { KanbanStatusSection } from './KanbanStatusSection'
import type {
  KanbanColumnWithCards,
  KanbanCardWithDetails,
} from '@/lib/types/database'

interface KanbanColumnProps {
  column: KanbanColumnWithCards
  onCardClick: (card: KanbanCardWithDetails) => void
  onEditColumn: (column: KanbanColumnWithCards) => void
  onPriorityChange?: (cardId: string, priority: number | null) => void
  onTimerToggle?: (cardId: string, isActive: boolean) => void
  onComplete?: (cardId: string, isDone: boolean) => void
  usedPriorities?: number[] // Which priorities (1, 2, 3) are already in use globally
}

export function KanbanColumn({
  column,
  onCardClick,
  onEditColumn,
  onPriorityChange,
  onTimerToggle,
  onComplete,
  usedPriorities = [],
}: KanbanColumnProps) {
  const [showDescription, setShowDescription] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-80 bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 flex flex-col max-h-full overflow-hidden transition-all duration-200 ${
        isDragging ? 'opacity-70 scale-105 z-50 shadow-2xl rotate-1' : 'hover:shadow-xl'
      }`}
    >
      {/* Colored accent bar at top */}
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(to right, ${column.color}, ${column.color}dd)`
        }}
      />

      <div className="border-b border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="p-4 flex items-center justify-between gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1.5 -ml-1 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 flex-shrink-0 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-2.5 flex-1 text-left group min-w-0"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-bold text-gray-800 dark:text-white truncate tracking-tight">
              {column.title}
            </h3>
            {column.description && (
              <div className="ml-auto flex-shrink-0">
                {showDescription ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400 transition-colors" />
                )}
              </div>
            )}
          </button>
          <button
            onClick={() => onEditColumn(column)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all flex-shrink-0"
          >
            <MoreVertical className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          </button>
        </div>
        {showDescription && column.description && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              {column.description}
            </p>
          </div>
        )}
      </div>

      <div className="overflow-y-auto p-4 space-y-5 flex-1 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-slate-900/30">
        <KanbanStatusSection
          status="todo"
          columnId={column.id}
          cards={column.todoCards}
          onCardClick={onCardClick}
          onPriorityChange={onPriorityChange}
          onTimerToggle={onTimerToggle}
          onComplete={onComplete}
          usedPriorities={usedPriorities}
        />
        <KanbanStatusSection
          status="in_progress"
          columnId={column.id}
          cards={column.inProgressCards}
          onCardClick={onCardClick}
          onPriorityChange={onPriorityChange}
          onTimerToggle={onTimerToggle}
          onComplete={onComplete}
          usedPriorities={usedPriorities}
        />
        <KanbanStatusSection
          status="done"
          columnId={column.id}
          cards={column.doneCards}
          onCardClick={onCardClick}
          onPriorityChange={onPriorityChange}
          onTimerToggle={onTimerToggle}
          onComplete={onComplete}
          usedPriorities={usedPriorities}
        />
      </div>
    </div>
  )
}
