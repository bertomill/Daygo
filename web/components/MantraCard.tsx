'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Mantra } from '@/lib/types/database'

interface MantraCardProps {
  mantra: Mantra
  onEdit?: (mantra: Mantra) => void
}

export function MantraCard({ mantra, onEdit }: MantraCardProps) {
  const [isGlowing, setIsGlowing] = useState(false)

  const handlePress = () => {
    setIsGlowing(true)
  }

  const handleRelease = () => {
    setIsGlowing(false)
  }

  return (
    <div
      className={`bg-gradient-to-r from-mantra/10 to-mantra/5 dark:from-mantra/20 dark:to-mantra/10 border border-mantra/30 rounded-xl p-4 cursor-pointer hover:from-mantra/20 hover:to-mantra/10 dark:hover:from-mantra/30 dark:hover:to-mantra/20 transition-all duration-200 ${
        isGlowing
          ? 'shadow-[0_0_30px_10px_rgba(168,85,247,0.4)] scale-[1.02] border-mantra/60'
          : ''
      }`}
      onClick={() => onEdit?.(mantra)}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
    >
      <div className="flex items-start gap-3">
        <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-all duration-200 ${
          isGlowing ? 'text-mantra scale-125' : 'text-mantra'
        }`} />
        <p className="text-gray-900 dark:text-white italic">{mantra.text}</p>
      </div>
    </div>
  )
}
