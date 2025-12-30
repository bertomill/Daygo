'use client'

import { useState } from 'react'
import { Eye, MoreHorizontal } from 'lucide-react'
import type { Vision } from '@/lib/types/database'

interface VisionCardProps {
  vision: Vision
  onEdit?: (vision: Vision) => void
}

export function VisionCard({ vision, onEdit }: VisionCardProps) {
  const [isGlowing, setIsGlowing] = useState(false)

  const handleClick = () => {
    setIsGlowing(!isGlowing)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(vision)
  }

  return (
    <div
      className={`bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
        isGlowing
          ? 'shadow-bevel-lg scale-[1.02] ring-2 ring-bevel-blue/30'
          : 'shadow-bevel hover:shadow-bevel-md'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
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
