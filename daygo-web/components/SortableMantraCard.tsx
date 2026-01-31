'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Sparkles, MoreHorizontal } from 'lucide-react'
import type { Mantra } from '@/lib/types/database'

interface SortableMantraCardProps {
  mantra: Mantra
  onEdit?: (mantra: Mantra) => void
}

export function SortableMantraCard({ mantra, onEdit }: SortableMantraCardProps) {
  const [isGlowing, setIsGlowing] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mantra.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
  }

  const handleCardClick = () => {
    setIsGlowing(!isGlowing)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(mantra)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'opacity-50 shadow-bevel-lg scale-[1.02]'
          : isGlowing
            ? 'shadow-bevel-lg scale-[1.02] ring-2 ring-mantra/30'
            : 'shadow-bevel hover:shadow-bevel-md'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 text-bevel-text-secondary dark:text-slate-400 hover:text-bevel-text dark:hover:text-slate-200 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className={`flex-shrink-0 transition-all duration-200 ${
          isGlowing ? 'scale-125' : ''
        }`}>
          <Sparkles className="w-6 h-6 text-mantra" />
        </div>
        <p className="text-bevel-text dark:text-white font-medium flex-1 leading-relaxed">{mantra.text}</p>
        <button
          onClick={handleOptionsClick}
          className="p-2 -m-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
          aria-label="Mantra options"
        >
          <MoreHorizontal className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
        </button>
      </div>
    </div>
  )
}
