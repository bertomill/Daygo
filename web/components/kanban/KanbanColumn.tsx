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
}

export function KanbanColumn({
  column,
  onCardClick,
  onEditColumn,
  onPriorityChange,
  onTimerToggle,
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
      className={`flex-shrink-0 w-80 bg-bevel-card dark:bg-slate-800 rounded-3xl shadow-bevel-lg flex flex-col max-h-full overflow-hidden ${
        isDragging ? 'opacity-50 scale-105 z-50' : ''
      }`}
    >
      {/* Colored accent bar at top */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: column.color }}
      />

      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="p-4 flex items-center justify-between gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-2 flex-1 text-left group min-w-0"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {column.title}
            </h3>
            {column.description && (
              <div className="ml-auto flex-shrink-0">
                {showDescription ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400" />
                )}
              </div>
            )}
          </button>
          <button
            onClick={() => onEditColumn(column)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          </button>
        </div>
        {showDescription && column.description && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {column.description}
            </p>
          </div>
        )}
      </div>

      <div className="overflow-y-auto p-4 space-y-4 flex-1">
        <KanbanStatusSection
          status="todo"
          columnId={column.id}
          cards={column.todoCards}
          onCardClick={onCardClick}
          onPriorityChange={onPriorityChange}
          onTimerToggle={onTimerToggle}
        />
        <KanbanStatusSection
          status="in_progress"
          columnId={column.id}
          cards={column.inProgressCards}
          onCardClick={onCardClick}
          onPriorityChange={onPriorityChange}
          onTimerToggle={onTimerToggle}
        />
        <KanbanStatusSection
          status="done"
          columnId={column.id}
          cards={column.doneCards}
          onCardClick={onCardClick}
          onPriorityChange={onPriorityChange}
          onTimerToggle={onTimerToggle}
        />
      </div>
    </div>
  )
}
