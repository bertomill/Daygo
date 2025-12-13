'use client'

import { Sparkles } from 'lucide-react'
import type { Mantra } from '@/lib/types/database'

interface MantraCardProps {
  mantra: Mantra
  onEdit?: (mantra: Mantra) => void
}

export function MantraCard({ mantra, onEdit }: MantraCardProps) {
  return (
    <div
      className="bg-gradient-to-r from-mantra/20 to-mantra/10 border border-mantra/30 rounded-xl p-4 cursor-pointer hover:from-mantra/30 hover:to-mantra/20 transition-all"
      onClick={() => onEdit?.(mantra)}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-mantra flex-shrink-0 mt-0.5" />
        <p className="text-white italic">{mantra.text}</p>
      </div>
    </div>
  )
}
