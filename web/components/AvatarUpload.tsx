'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Loader2, User, X } from 'lucide-react'
import { profilesService } from '@/lib/services/profiles'
import Image from 'next/image'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  onUploadComplete?: (url: string) => void
}

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update local state when prop changes
  useEffect(() => {
    setAvatarUrl(currentAvatarUrl || null)
  }, [currentAvatarUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const url = await profilesService.uploadAvatar(userId, file)
      setAvatarUrl(url)
      onUploadComplete?.(url)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to upload avatar. Please try again.'
      setError(errorMessage)
      console.error('Avatar upload error:', err)
      alert(`Upload failed: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploading(true)
    setError(null)

    try {
      await profilesService.deleteAvatar(userId)
      setAvatarUrl(null)
      onUploadComplete?.('')
    } catch (err) {
      setError('Failed to remove avatar. Please try again.')
      console.error('Avatar removal error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-accent/20 flex items-center justify-center border-2 border-gray-200 dark:border-slate-700">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-accent" />
          )}
        </div>

        {/* Upload/Change button */}
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-accent hover:bg-accent/90 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>

        {/* Remove button */}
        {avatarUrl && !isUploading && (
          <button
            onClick={handleRemoveAvatar}
            className="absolute top-0 right-0 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
        Click camera icon to upload<br />
        Max size: 5MB
      </p>
    </div>
  )
}
