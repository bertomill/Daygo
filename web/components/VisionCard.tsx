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
      className={`bg-gradient-to-r from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:from-blue-500/20 hover:to-blue-500/10 dark:hover:from-blue-500/30 dark:hover:to-blue-500/20 transition-all duration-200 ${
        isGlowing
          ? 'shadow-[0_0_30px_10px_rgba(59,130,246,0.4)] scale-[1.02] border-blue-500/60'
          : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Eye className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-all duration-200 ${
          isGlowing ? 'text-blue-500 scale-125' : 'text-blue-500'
        }`} />
        <div
          className="text-gray-900 dark:text-white flex-1 prose prose-sm dark:prose-invert max-w-none [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: vision.text }}
        />
        <button
          onClick={handleOptionsClick}
          className="p-1 -m-1 hover:bg-blue-500/20 rounded-lg transition-colors flex-shrink-0"
          aria-label="Vision options"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-400 dark:text-slate-500" />
        </button>
      </div>
    </div>
  )
}
