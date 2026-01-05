'use client'

import { useQuery } from '@tanstack/react-query'
import { Salad, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import type { HealthyFoodImage } from '@/app/api/healthy-foods/route'

interface HealthyFoodsResponse {
  images: HealthyFoodImage[]
  error?: string
}

export function HealthyFoodsCard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<HealthyFoodsResponse>({
    queryKey: ['healthy-foods'],
    queryFn: async () => {
      const response = await fetch('/api/healthy-foods')
      if (!response.ok) {
        throw new Error('Failed to fetch healthy foods')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1,
  })

  if (error) {
    return (
      <div className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5">
        <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
          <Salad className="w-5 h-5" />
          <span className="text-sm">Unable to load healthy food inspiration</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Salad className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-bevel-text dark:text-white">
            Healthy Food Inspiration
          </span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 -m-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          aria-label="Refresh images"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-28 h-28 flex-shrink-0 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : data?.images && data.images.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {data.images.map((image) => (
            <div
              key={image.id}
              className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden snap-start group"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="112px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white truncate">
                  {image.photographer}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-slate-400">
          No images available
        </div>
      )}
    </div>
  )
}
