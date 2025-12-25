'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { ScheduleEvent } from '@/lib/types/database'

interface ScheduleGridProps {
  events: ScheduleEvent[]
  selectedDate: Date
  onAddEvent: (startTime: string, endTime: string) => void
  onEditEvent: (event: ScheduleEvent) => void
}

const HOUR_HEIGHT = 60
const START_HOUR = 6
const END_HOUR = 22
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour} ${period}`
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTimeDisplay(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

function yToMinutes(y: number, gridHeight: number): number {
  const totalMinutes = (END_HOUR - START_HOUR) * 60
  const rawMinutes = (y / gridHeight) * totalMinutes
  // Round to nearest 15 minutes
  return Math.round(rawMinutes / 15) * 15
}

export function ScheduleGrid({ events, selectedDate, onAddEvent, onEditEvent }: ScheduleGridProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const dragStartTime = useRef<number>(0)

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selected = new Date(selectedDate)
      selected.setHours(0, 0, 0, 0)

      if (selected.getTime() === today.getTime()) {
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()

        if (currentHour >= START_HOUR && currentHour < END_HOUR) {
          const minutesFromStart = (currentHour - START_HOUR) * 60 + currentMinute
          setCurrentTimePosition(minutesFromStart)
        } else {
          setCurrentTimePosition(null)
        }
      } else {
        setCurrentTimePosition(null)
      }
    }

    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 60000)
    return () => clearInterval(interval)
  }, [selectedDate])

  const getMinutesFromEvent = useCallback((e: React.MouseEvent | MouseEvent): number => {
    if (!gridRef.current) return 0
    const rect = gridRef.current.getBoundingClientRect()
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    return yToMinutes(y, rect.height)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Don't start drag if clicking on an event
    if ((e.target as HTMLElement).closest('[data-event]')) return

    const minutes = getMinutesFromEvent(e)
    setIsDragging(true)
    setDragStart(minutes)
    setDragEnd(minutes)
    dragStartTime.current = Date.now()
  }, [getMinutesFromEvent])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const minutes = getMinutesFromEvent(e)
    setDragEnd(minutes)
  }, [isDragging, getMinutesFromEvent])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging || dragStart === null) {
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    const endMinutes = getMinutesFromEvent(e)
    const dragDuration = Date.now() - dragStartTime.current
    const isClick = dragDuration < 200 && Math.abs(endMinutes - dragStart) < 15

    let startMinutes: number
    let finalEndMinutes: number

    if (isClick) {
      // Single click - create 15-minute event
      startMinutes = dragStart
      finalEndMinutes = dragStart + 15
    } else {
      // Drag - create event spanning the drag
      startMinutes = Math.min(dragStart, endMinutes)
      finalEndMinutes = Math.max(dragStart, endMinutes)
      // Ensure minimum 15 minutes
      if (finalEndMinutes - startMinutes < 15) {
        finalEndMinutes = startMinutes + 15
      }
    }

    // Convert to absolute minutes (add START_HOUR offset)
    const absoluteStartMinutes = START_HOUR * 60 + startMinutes
    const absoluteEndMinutes = START_HOUR * 60 + finalEndMinutes

    // Clamp to valid range
    const clampedStart = Math.max(START_HOUR * 60, Math.min(absoluteStartMinutes, END_HOUR * 60 - 15))
    const clampedEnd = Math.min(END_HOUR * 60, Math.max(absoluteEndMinutes, clampedStart + 15))

    const startTime = minutesToTimeString(clampedStart)
    const endTime = minutesToTimeString(clampedEnd)

    onAddEvent(startTime, endTime)

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, getMinutesFromEvent, onAddEvent])

  // Add global mouse listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const getEventStyle = (event: ScheduleEvent) => {
    const startMinutes = timeToMinutes(event.start_time)
    const endMinutes = timeToMinutes(event.end_time)
    const startOffset = startMinutes - START_HOUR * 60
    const duration = endMinutes - startMinutes

    return {
      top: `${(startOffset / 60) * HOUR_HEIGHT}px`,
      height: `${(duration / 60) * HOUR_HEIGHT}px`,
    }
  }

  const isEventVisible = (event: ScheduleEvent) => {
    const startMinutes = timeToMinutes(event.start_time)
    const endMinutes = timeToMinutes(event.end_time)
    return startMinutes < END_HOUR * 60 && endMinutes > START_HOUR * 60
  }

  // Calculate drag preview style
  const getDragPreviewStyle = () => {
    if (dragStart === null || dragEnd === null) return null

    const start = Math.min(dragStart, dragEnd)
    const end = Math.max(dragStart, dragEnd)
    const duration = Math.max(end - start, 15) // Minimum 15 minutes

    return {
      top: `${(start / 60) * HOUR_HEIGHT}px`,
      height: `${(duration / 60) * HOUR_HEIGHT}px`,
    }
  }

  const dragPreviewStyle = getDragPreviewStyle()

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex">
        {/* Hour labels */}
        <div className="w-14 flex-shrink-0 border-r border-gray-200 dark:border-slate-700">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="relative"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              <span className="absolute -top-2 right-2 text-xs text-gray-400 dark:text-slate-500">
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Grid area */}
        <div
          ref={gridRef}
          className={`flex-1 relative select-none ${isDragging ? 'cursor-ns-resize' : 'cursor-pointer'}`}
          style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
          onMouseDown={handleMouseDown}
        >
          {/* Hour grid lines */}
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-slate-700/50"
              style={{ top: `${index * HOUR_HEIGHT}px` }}
            />
          ))}

          {/* 30-min grid lines (subtle) */}
          {HOURS.map((hour, index) => (
            <div
              key={`half-${hour}`}
              className="absolute left-0 right-0 border-t border-gray-50 dark:border-slate-700/30 border-dashed"
              style={{ top: `${index * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
            />
          ))}

          {/* Drag preview */}
          {isDragging && dragPreviewStyle && (
            <div
              className="absolute left-1 right-1 bg-schedule/40 border-2 border-schedule border-dashed rounded-lg z-20 pointer-events-none"
              style={dragPreviewStyle}
            >
              <div className="px-2 py-1">
                <p className="text-schedule text-sm font-medium">
                  {(() => {
                    const start = Math.min(dragStart!, dragEnd!)
                    const end = Math.max(dragStart!, dragEnd!)
                    const duration = Math.max(end - start, 15)
                    const startTime = minutesToTimeString(START_HOUR * 60 + start)
                    const endTime = minutesToTimeString(START_HOUR * 60 + start + duration)
                    return `${formatTimeDisplay(startTime)} - ${formatTimeDisplay(endTime)}`
                  })()}
                </p>
              </div>
            </div>
          )}

          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${(currentTimePosition / 60) * HOUR_HEIGHT}px` }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-schedule" />
                <div className="flex-1 h-0.5 bg-schedule" />
              </div>
            </div>
          )}

          {/* Events */}
          {events.filter(isEventVisible).map((event) => (
            <div
              key={event.id}
              data-event
              className="absolute left-1 right-1 bg-schedule/90 hover:bg-schedule rounded-lg px-2 py-1 cursor-pointer transition-colors z-10 overflow-hidden"
              style={getEventStyle(event)}
              onClick={(e) => {
                e.stopPropagation()
                onEditEvent(event)
              }}
            >
              <p className="text-white text-sm font-medium truncate">{event.title}</p>
              <p className="text-white/80 text-xs truncate">
                {formatTimeDisplay(event.start_time)} - {formatTimeDisplay(event.end_time)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
