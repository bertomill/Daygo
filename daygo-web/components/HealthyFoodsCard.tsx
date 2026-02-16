'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Leaf, Drumstick, Apple, Plus, X, Loader2, Shuffle, Sparkles, Wheat, Pencil, ShoppingCart, Check } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, useEffect, useCallback } from 'react'
import { foodImagesService } from '@/lib/services/foodImages'
import { useAuthStore } from '@/lib/auth-store'
import type { FoodImage, FoodCategory } from '@/lib/types/database'

const CATEGORIES: { key: FoodCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'plants', label: 'Plants', icon: <Leaf className="w-4 h-4" />, color: 'text-green-600 dark:text-green-400' },
  { key: 'meats', label: 'Proteins', icon: <Drumstick className="w-4 h-4" />, color: 'text-red-600 dark:text-red-400' },
  { key: 'carbs', label: 'Carbs', icon: <Wheat className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400' },
  { key: 'fruit', label: 'Fruit', icon: <Apple className="w-4 h-4" />, color: 'text-orange-600 dark:text-orange-400' },
  { key: 'superfoods', label: 'Superfoods', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400' },
]

function weightedSelect(items: FoodImage[], count: number): FoodImage[] {
  if (items.length <= count) return [...items]
  const selected: FoodImage[] = []
  const remaining = [...items]

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + Math.max(item.weight ?? 5, 1), 0)
    let rand = Math.random() * totalWeight
    let pickedIndex = 0
    for (let j = 0; j < remaining.length; j++) {
      rand -= Math.max(remaining[j].weight ?? 50, 1)
      if (rand <= 0) {
        pickedIndex = j
        break
      }
    }
    selected.push(remaining[pickedIndex])
    remaining.splice(pickedIndex, 1)
  }

  return selected
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
  onUpdateLabel: (id: string, name: string, weight?: number) => void
  isUploading: boolean
  editingImageId: string | null
  onStartEdit: (id: string) => void
  onEndEdit: () => void
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
  onUpdateLabel,
  isUploading,
  editingImageId,
  onStartEdit,
  onEndEdit,
}: CategorySectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      e.target.value = ''
    }
  }

  const [editWeight, setEditWeight] = useState(5)
  const editContainerRef = useRef<HTMLDivElement>(null)

  const handleStartEdit = (image: FoodImage) => {
    setEditValue(image.name || '')
    setEditWeight(image.weight ?? 5)
    onStartEdit(image.id)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSaveLabel = (imageId: string) => {
    const currentImage = images.find(img => img.id === imageId)
    const originalWeight = currentImage?.weight ?? 5
    const weightChanged = editWeight !== originalWeight
    onUpdateLabel(imageId, editValue.trim(), weightChanged ? editWeight : undefined)
    onEndEdit()
  }

  const handleEditBlur = (e: React.FocusEvent, imageId: string) => {
    // Don't close if focus is moving to another element within the edit container
    if (editContainerRef.current?.contains(e.relatedTarget as Node)) return
    handleSaveLabel(imageId)
  }

  const handleKeyDown = (e: React.KeyboardEvent, imageId: string) => {
    if (e.key === 'Enter') {
      handleSaveLabel(imageId)
    } else if (e.key === 'Escape') {
      onEndEdit()
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
          <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-auto">Ctrl+V to paste</span>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {displayImages.map((image) => (
          <div
            key={image.id}
            className="flex-shrink-0"
          >
            <div
              className="relative w-20 h-20 rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => !isGenerateMode && handleStartEdit(image)}
            >
              <Image
                src={image.image_url}
                alt={image.name || category.label}
                fill
                className="object-cover"
                sizes="80px"
              />
              {/* Label overlay */}
              {image.name && !isGenerateMode && editingImageId !== image.id && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <p className="text-[10px] text-white truncate text-center">{image.name}</p>
                </div>
              )}
              {/* Edit hint when no label */}
              {!image.name && !isGenerateMode && editingImageId !== image.id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
              )}
              {/* Weight indicator bar */}
              {!isGenerateMode && editingImageId !== image.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1">
                  <div
                    className="h-full bg-green-400/80"
                    style={{ width: `${((image.weight ?? 5) / 10) * 100}%` }}
                  />
                </div>
              )}
              {!isGenerateMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(image.id)
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
            {/* Inline edit: label + weight stepper */}
            {editingImageId === image.id && (
              <div ref={editContainerRef} className="w-20 mt-1 space-y-1" onBlur={(e) => handleEditBlur(e, image.id)}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, image.id)}
                  placeholder="Add label..."
                  className="w-full px-1 py-0.5 text-[10px] text-center text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditWeight(Math.max(0, editWeight - 1))}
                    className="w-4 h-4 flex items-center justify-center rounded bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-slate-500"
                  >
                    −
                  </button>
                  <span className="text-[10px] text-gray-600 dark:text-slate-300 w-4 text-center font-medium">{editWeight}</span>
                  <button
                    type="button"
                    onClick={() => setEditWeight(Math.min(10, editWeight + 1))}
                    className="w-4 h-4 flex items-center justify-center rounded bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-slate-500"
                  >
                    +
                  </button>
                </div>
              </div>
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
              <Loader2 className="w-5 h-5 text-gray-400 dark:text-slate-500 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            )}
          </button>
        )}
        {isGenerateMode && displayImages.length === 0 && (
          <div className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-center">
            <span className="text-xs text-gray-400 dark:text-slate-500">None</span>
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
  const [generatedSelection, setGeneratedSelection] = useState<Partial<Record<FoodCategory, FoodImage[]>>>({
    plants: [],
    meats: [],
    carbs: [],
    fruit: [],
    superfoods: [],
  })
  const [focusedCategory, setFocusedCategory] = useState<FoodCategory | null>(null)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [isGroceryListMode, setIsGroceryListMode] = useState(false)
  const [groceryList, setGroceryList] = useState<{ category: FoodCategory; label: string; name: string; imageUrl: string; checked: boolean }[]>([])
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

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

  const updateLabelMutation = useMutation({
    mutationFn: ({ id, name, weight }: { id: string; name: string; weight?: number }) =>
      foodImagesService.updateFoodImage(id, user!.id, { name: name || null, ...(weight !== undefined && { weight }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-images', user?.id] })
    },
    onError: (error) => {
      console.error('Failed to update label:', error)
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
    // Combine fish images with meats (proteins)
    if (cat.key === 'meats') {
      acc[cat.key] = images.filter((img) => img.category === 'meats' || img.category === 'fish')
    } else {
      acc[cat.key] = images.filter((img) => img.category === cat.key)
    }
    return acc
  }, {} as Record<FoodCategory, FoodImage[]>)

  const handleGenerate = useCallback(() => {
    const newSelection: Partial<Record<FoodCategory, FoodImage[]>> = {
      plants: [],
      meats: [],
      carbs: [],
      fruit: [],
      superfoods: [],
    }

    for (const category of CATEGORIES) {
      const categoryImages = imagesByCategory[category.key]
      newSelection[category.key] = weightedSelect(categoryImages, 3)
    }

    setGeneratedSelection(newSelection)
    setIsGenerateMode(true)
  }, [imagesByCategory])

  const handleEdit = () => {
    setIsGenerateMode(false)
    setIsGroceryListMode(false)
  }

  const handleMakeGroceryList = useCallback(() => {
    const list: { category: FoodCategory; label: string; name: string; imageUrl: string; checked: boolean }[] = []

    for (const category of CATEGORIES) {
      const categoryImages = imagesByCategory[category.key]
      // Only include images that have labels
      const labeledImages = categoryImages.filter((img) => img.name)
      const selected = weightedSelect(labeledImages, 3)

      for (const img of selected) {
        if (img.name) {
          list.push({
            category: category.key,
            label: category.label,
            name: img.name,
            imageUrl: img.image_url,
            checked: false,
          })
        }
      }
    }

    setGroceryList(list)
    setCheckedItems(new Set())
    setIsGroceryListMode(true)
    setIsGenerateMode(false)
  }, [imagesByCategory])

  const toggleGroceryItem = (name: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 dark:text-slate-500 animate-spin" />
        </div>
      </div>
    )
  }

  const hasAnyImages = images.length > 0
  const hasAnyLabels = images.some((img) => img.name)

  return (
    <div className="bg-bevel-card dark:bg-slate-800 shadow-bevel rounded-2xl p-5 space-y-4">
      {/* Header with Generate/Edit/Grocery List buttons */}
      <div className="flex items-center justify-end gap-3 -mt-1 -mb-2">
        {isGenerateMode || isGroceryListMode ? (
          <button
            onClick={handleEdit}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Edit Photos
          </button>
        ) : (
          <>
            <button
              onClick={handleMakeGroceryList}
              disabled={!hasAnyLabels}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Grocery List
            </button>
            <button
              onClick={handleGenerate}
              disabled={!hasAnyImages}
              className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Generate
            </button>
          </>
        )}
      </div>

      {/* Grocery List View */}
      {isGroceryListMode && (
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const categoryItems = groceryList.filter((item) => item.category === category.key)
            if (categoryItems.length === 0) return null

            return (
              <div key={category.key} className="space-y-2">
                <div className={`flex items-center gap-2 ${category.color}`}>
                  {category.icon}
                  <span className="text-xs font-medium uppercase tracking-wide">{category.label}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {categoryItems.map((item) => {
                    const isChecked = checkedItems.has(`${item.category}-${item.name}`)
                    return (
                      <button
                        key={`${item.category}-${item.name}`}
                        onClick={() => toggleGroceryItem(`${item.category}-${item.name}`)}
                        className="flex-shrink-0 group"
                      >
                        <div
                          className={`relative w-20 h-20 rounded-xl overflow-hidden transition-opacity ${
                            isChecked ? 'opacity-50' : ''
                          }`}
                        >
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                          {/* Checkmark overlay */}
                          {isChecked && (
                            <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                              <Check className="w-8 h-8 text-white" />
                            </div>
                          )}
                          {/* Label overlay */}
                          <div className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 ${
                            isChecked ? 'bg-green-600/80' : 'bg-black/60'
                          }`}>
                            <p className={`text-[10px] text-white truncate text-center ${
                              isChecked ? 'line-through' : ''
                            }`}>
                              {item.name}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {groceryList.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
              No labeled items found. Add labels to your food images first.
            </p>
          )}
        </div>
      )}

      {/* Normal/Generate View */}
      {!isGroceryListMode && CATEGORIES.map((category) => (
        <CategorySection
          key={category.key}
          category={category}
          images={imagesByCategory[category.key]}
          selectedImages={generatedSelection[category.key] || []}
          isGenerateMode={isGenerateMode}
          isFocused={focusedCategory === category.key}
          onFocus={() => setFocusedCategory(category.key)}
          onBlur={() => setFocusedCategory(null)}
          onUpload={(file) => uploadMutation.mutate({ category: category.key, file })}
          onDelete={(id) => deleteMutation.mutate(id)}
          onUpdateLabel={(id, name, weight) => updateLabelMutation.mutate({ id, name, weight })}
          isUploading={uploadingCategory === category.key}
          editingImageId={editingImageId}
          onStartEdit={(id) => setEditingImageId(id)}
          onEndEdit={() => setEditingImageId(null)}
        />
      ))}
    </div>
  )
}
