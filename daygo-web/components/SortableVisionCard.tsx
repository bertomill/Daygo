'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, MoreHorizontal } from 'lucide-react'
import type { Vision } from '@/lib/types/database'

interface SortableVisionCardProps {
  vision: Vision
  onEdit?: (vision: Vision) => void
}

export function SortableVisionCard({ vision, onEdit }: SortableVisionCardProps) {
  const [isGlowing, setIsGlowing] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vision.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleCardClick = () => {
    setIsGlowing(!isGlowing)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(vision)
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
            ? 'shadow-bevel-lg scale-[1.02] ring-2 ring-bevel-blue/30'
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
          <Eye className="w-6 h-6 text-bevel-blue" />
        </div>
        <div
          className="text-bevel-text dark:text-white flex-1 prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: vision.text }}
        />
        <button
          onClick={handleOptionsClick}
          className="p-2 -m-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
          aria-label="Vision options"
        >
          <MoreHorizontal className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
        </button>
      </div>
    </div>
  )
}
