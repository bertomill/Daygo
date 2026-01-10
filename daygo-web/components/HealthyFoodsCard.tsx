'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Leaf, Drumstick, Fish, Apple, Plus, X, Loader2, Shuffle, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, useEffect, useCallback } from 'react'
import { foodImagesService } from '@/lib/services/foodImages'
import { useAuthStore } from '@/lib/auth-store'
import type { FoodImage, FoodCategory } from '@/lib/types/database'

const CATEGORIES: { key: FoodCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'plants', label: 'Plants', icon: <Leaf className="w-4 h-4" />, color: 'text-green-500' },
  { key: 'meats', label: 'Meats', icon: <Drumstick className="w-4 h-4" />, color: 'text-red-500' },
  { key: 'fish', label: 'Fish', icon: <Fish className="w-4 h-4" />, color: 'text-blue-500' },
  { key: 'fruit', label: 'Fruit', icon: <Apple className="w-4 h-4" />, color: 'text-orange-500' },
  { key: 'superfoods', label: 'Superfoods', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-500' },
]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface CategorySectionProps {
  category: typeof CATEGORIES[number]
  images: FoodImage[]
  selectedImages: FoodImage[]
  isGenerateMode: boolean
  isFocused: boolean
  onFocus: () => void
  onBlur: () => void
  onUpload: (file: File) => void
  onDelete: (id: string) => void
  isUploading: boolean
}

function CategorySection({
  category,
  images,
  selectedImages,
  isGenerateMode,
  isFocused,
  onFocus,
  onBlur,
  onUpload,
  onDelete,
  isUploading,
}: CategorySectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      e.target.value = ''
    }
  }

  const displayImages = isGenerateMode ? selectedImages : images

  return (
    <div
      className={`space-y-2 rounded-lg p-2 -m-2 transition-colors ${isFocused ? 'bg-gray-50 dark:bg-slate-700/30' : ''}`}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className={`flex items-center gap-2 ${category.color}`}>
        {category.icon}
        <span className="text-xs font-medium uppercase tracking-wide">{category.label}</span>
        {isFocused && (
          <span className="text-[10px] text-gray-400 ml-auto">Ctrl+V to paste</span>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {displayImages.map((image) => (
          <div
            key={image.id}
            className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden group"
          >
            <Image
              src={image.image_url}
              alt={image.name || category.label}
              fill
              className="object-cover"
              sizes="80px"
            />
            {!isGenerateMode && (
              <button
                onClick={() => onDelete(image.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        ))}
        {!isGenerateMode && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-center hover:border-gray-300 dark:hover:border-slate-500 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
        {isGenerateMode && displayImages.length === 0 && (
          <div className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-center">
            <span className="text-xs text-gray-400">None</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

export function HealthyFoodsCard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [uploadingCategory, setUploadingCategory] = useState<FoodCategory | null>(null)
  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [generatedSelection, setGeneratedSelection] = useState<Record<FoodCategory, FoodImage[]>>({
    plants: [],
    meats: [],
    fish: [],
    fruit: [],
    superfoods: [],
  })
  const [focusedCategory, setFocusedCategory] = useState<FoodCategory | null>(null)

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['food-images', user?.id],
    queryFn: () => foodImagesService.getFoodImages(user!.id),
    enabled: !!user?.id,
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ category, file }: { category: FoodCategory; file: File }) => {
      setUploadingCategory(category)
      return foodImagesService.createFoodImage(user!.id, category, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-images', user?.id] })
    },
    onSettled: () => {
      setUploadingCategory(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => foodImagesService.deleteFoodImage(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-images', user?.id] })
    },
  })

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!focusedCategory) return

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            uploadMutation.mutate({ category: focusedCategory, file })
            break
          }
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [focusedCategory, uploadMutation])

  const imagesByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = images.filter((img) => img.category === cat.key)
    return acc
  }, {} as Record<FoodCategory, FoodImage[]>)

  const handleGenerate = useCallback(() => {
    const newSelection: Record<FoodCategory, FoodImage[]> = {
      plants: [],
      meats: [],
      fish: [],
      fruit: [],
      superfoods: [],
    }

    for (const category of CATEGORIES) {
      const categoryImages = imagesByCategory[category.key]
      newSelection[category.key] = shuffleArray(categoryImages).slice(0, 3)
    }

    setGeneratedSelection(newSelection)
    setIsGenerateMode(true)
  }, [imagesByCategory])

  const handleEdit = () => {
    setIsGenerateMode(false)
  }

  if (isLoading) {
    return (
      <div className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    )
  }

  const hasAnyImages = images.length > 0

  return (
    <div className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5 space-y-4">
      {/* Header with Generate/Edit button */}
      <div className="flex items-center justify-end -mt-1 -mb-2">
        {isGenerateMode ? (
          <button
            onClick={handleEdit}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Edit Photos
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!hasAnyImages}
            className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Generate
          </button>
        )}
      </div>

      {CATEGORIES.map((category) => (
        <CategorySection
          key={category.key}
          category={category}
          images={imagesByCategory[category.key]}
          selectedImages={generatedSelection[category.key]}
          isGenerateMode={isGenerateMode}
          isFocused={focusedCategory === category.key}
          onFocus={() => setFocusedCategory(category.key)}
          onBlur={() => setFocusedCategory(null)}
          onUpload={(file) => uploadMutation.mutate({ category: category.key, file })}
          onDelete={(id) => deleteMutation.mutate(id)}
          isUploading={uploadingCategory === category.key}
        />
      ))}
    </div>
  )
}
