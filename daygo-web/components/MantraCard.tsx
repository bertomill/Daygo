'use client'

import { useState } from 'react'
import { Sparkles, MoreHorizontal } from 'lucide-react'
import type { Mantra } from '@/lib/types/database'

interface MantraCardProps {
  mantra: Mantra
  onEdit?: (mantra: Mantra) => void
}

export function MantraCard({ mantra, onEdit }: MantraCardProps) {
  const [isGlowing, setIsGlowing] = useState(false)

  const handleClick = () => {
    setIsGlowing(!isGlowing)
  }

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(mantra)
  }

  return (
    <div
      className={`bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
        isGlowing
          ? 'shadow-bevel-lg scale-[1.02] ring-2 ring-mantra/30'
          : 'shadow-bevel hover:shadow-bevel-md'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
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
