'use client'

import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface SchedulePreferencesProps {
  wakeTime: string
  bedTime: string
  onUpdate: (wake: string, bed: string) => void
  isUpdating?: boolean
}

export function SchedulePreferences({
  wakeTime,
  bedTime,
  onUpdate,
  isUpdating,
}: SchedulePreferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localWake, setLocalWake] = useState(wakeTime)
  const [localBed, setLocalBed] = useState(bedTime)

  const handleSave = () => {
    onUpdate(localWake, localBed)
    setIsExpanded(false)
  }

  const hasChanges = localWake !== wakeTime || localBed !== bedTime

  // Format for display: "7:00 AM - 10:00 PM"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
          <Clock className="w-4 h-4" />
          <span>
            {formatTime(wakeTime)} - {formatTime(bedTime)}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Wake time
              </label>
              <input
                type="time"
                value={localWake}
                onChange={(e) => setLocalWake(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Bed time
              </label>
              <input
                type="time"
                value={localBed}
                onChange={(e) => setLocalBed(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
              />
            </div>
          </div>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
          )}
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
            AI will schedule events between these times
          </p>
        </div>
      )}
    </div>
  )
}
