'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
  DragOverlay,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import type {
  KanbanColumnWithCards,
  KanbanCardWithDetails,
  Goal,
} from '@/lib/types/database'

interface KanbanBoardProps {
  columns: KanbanColumnWithCards[]
  onCardClick: (card: KanbanCardWithDetails) => void
  onAddColumn: () => void
  onEditColumn: (column: KanbanColumnWithCards) => void
  onCardDrop: (cardId: string, newStatus: 'todo' | 'in_progress' | 'done', newColumnId: string) => void
  onCardReorder: (cardIds: string[]) => void
  onColumnReorder: (columnIds: string[]) => void
  onPriorityChange?: (cardId: string, priority: number | null) => void
  onTimerToggle?: (cardId: string, isActive: boolean) => void
}

export function KanbanBoard({
  columns,
  onCardClick,
  onAddColumn,
  onEditColumn,
  onCardDrop,
  onCardReorder,
  onColumnReorder,
  onPriorityChange,
  onTimerToggle,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<KanbanCardWithDetails | null>(null)
  const [activeColumn, setActiveColumn] = useState<KanbanColumnWithCards | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string

    // Check if it's a column
    const column = columns.find(col => col.id === id)
    if (column) {
      setActiveColumn(column)
      return
    }

    // Otherwise it's a card
    const card = columns
      .flatMap(col => [...col.todoCards, ...col.inProgressCards, ...col.doneCards])
      .find(c => c.id === id)
    setActiveCard(card || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveCard(null)
      setActiveColumn(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Check if we're dragging a column
    if (activeColumn) {
      setActiveColumn(null)

      // Find the old and new index of the column
      const oldIndex = columns.findIndex(col => col.id === activeId)
      const newIndex = columns.findIndex(col => col.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedColumns = arrayMove(columns, oldIndex, newIndex)
        onColumnReorder(reorderedColumns.map(col => col.id))
      }
      return
    }

    // Otherwise we're dragging a card
    setActiveCard(null)

    // Find the active card to check its current section
    const activeCardData = columns
      .flatMap(col => [...col.todoCards, ...col.inProgressCards, ...col.doneCards])
      .find(c => c.id === activeId)

    if (!activeCardData) return

    // Check if dropped on a droppable zone (format: "columnId-status")
    // Droppable zones end with -todo, -in_progress, or -done
    if (overId.endsWith('-todo') || overId.endsWith('-in_progress') || overId.endsWith('-done')) {
      const lastDashIndex = overId.lastIndexOf('-')
      const newColumnId = overId.substring(0, lastDashIndex)
      const newStatus = overId.substring(lastDashIndex + 1)
      onCardDrop(activeId, newStatus as 'todo' | 'in_progress' | 'done', newColumnId)
    } else {
      // Dropped on another card
      const overCard = columns
        .flatMap(col => [...col.todoCards, ...col.inProgressCards, ...col.doneCards])
        .find(card => card.id === overId)

      if (overCard) {
        // Check if it's within the same section (same column and status)
        if (overCard.column_id === activeCardData.column_id && overCard.status === activeCardData.status) {
          // Reorder within the same section
          const column = columns.find(col => col.id === overCard.column_id)
          if (!column) return

          const sectionCards =
            overCard.status === 'todo' ? column.todoCards :
            overCard.status === 'in_progress' ? column.inProgressCards :
            column.doneCards

          const oldIndex = sectionCards.findIndex(c => c.id === activeId)
          const newIndex = sectionCards.findIndex(c => c.id === overId)

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reorderedCards = arrayMove(sectionCards, oldIndex, newIndex)
            onCardReorder(reorderedCards.map(c => c.id))
          }
        } else {
          // Move to different section
          onCardDrop(activeId, overCard.status, overCard.column_id)
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <SortableContext
          items={columns.map(col => col.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 px-4 pb-4 pt-4 min-w-min h-full">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onCardClick={onCardClick}
                onEditColumn={onEditColumn}
                onPriorityChange={onPriorityChange}
                onTimerToggle={onTimerToggle}
              />
            ))}

            <button
              onClick={onAddColumn}
              className="flex-shrink-0 w-80 h-fit bg-bevel-card dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-3xl shadow-bevel p-4 hover:border-accent dark:hover:border-accent hover:shadow-bevel-lg transition-all"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-slate-400">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Column</span>
              </div>
            </button>
          </div>
        </SortableContext>
      </div>
      <DragOverlay>
        {activeColumn ? (
          <div className="opacity-80 rotate-2">
            <KanbanColumn
              column={activeColumn}
              onCardClick={onCardClick}
              onEditColumn={onEditColumn}
              onPriorityChange={onPriorityChange}
              onTimerToggle={onTimerToggle}
            />
          </div>
        ) : activeCard ? (
          <div className="opacity-80 rotate-3 scale-105">
            <KanbanCard card={activeCard} onClick={() => {}} onPriorityChange={onPriorityChange} onTimerToggle={onTimerToggle} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
