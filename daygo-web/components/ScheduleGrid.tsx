'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Sparkles,
  Laptop,
  Dumbbell,
  Utensils,
  Coffee,
  BookOpen,
  Brain,
  Mail,
  Users,
  Mic,
  Pencil,
  Moon,
  Phone,
  ShoppingBag,
  Heart,
  Check,
  type LucideIcon
} from 'lucide-react'
import type { ScheduleEvent } from '@/lib/types/database'

// Google Calendar event type for display
export interface GoogleCalendarDisplayEvent {
  id: string
  title: string
  description?: string | null
  start_time: string
  end_time: string
  is_all_day?: boolean
}

type EventCategory = 'work' | 'exercise' | 'meal' | 'break' | 'learning' | 'mindfulness' | 'admin' | 'social' | 'creative' | 'podcast' | 'sleep' | 'call' | 'errand' | 'health' | 'default'

interface CategoryStyle {
  icon: LucideIcon
  bg: string
  hover: string
  border: string
}

const categoryStyles: Record<EventCategory, CategoryStyle> = {
  work: { icon: Laptop, bg: 'bg-blue-500/50', hover: 'hover:bg-blue-500/65', border: 'border-blue-300/40' },
  exercise: { icon: Dumbbell, bg: 'bg-orange-500/50', hover: 'hover:bg-orange-500/65', border: 'border-orange-300/40' },
  meal: { icon: Utensils, bg: 'bg-amber-500/50', hover: 'hover:bg-amber-500/65', border: 'border-amber-300/40' },
  break: { icon: Coffee, bg: 'bg-slate-500/50', hover: 'hover:bg-slate-500/65', border: 'border-slate-300/40' },
  learning: { icon: BookOpen, bg: 'bg-indigo-500/50', hover: 'hover:bg-indigo-500/65', border: 'border-indigo-300/40' },
  mindfulness: { icon: Brain, bg: 'bg-teal-500/50', hover: 'hover:bg-teal-500/65', border: 'border-teal-300/40' },
  admin: { icon: Mail, bg: 'bg-gray-500/50', hover: 'hover:bg-gray-500/65', border: 'border-gray-300/40' },
  social: { icon: Users, bg: 'bg-pink-500/50', hover: 'hover:bg-pink-500/65', border: 'border-pink-300/40' },
  creative: { icon: Pencil, bg: 'bg-purple-500/50', hover: 'hover:bg-purple-500/65', border: 'border-purple-300/40' },
  podcast: { icon: Mic, bg: 'bg-rose-500/50', hover: 'hover:bg-rose-500/65', border: 'border-rose-300/40' },
  sleep: { icon: Moon, bg: 'bg-indigo-600/50', hover: 'hover:bg-indigo-600/65', border: 'border-indigo-400/40' },
  call: { icon: Phone, bg: 'bg-green-500/50', hover: 'hover:bg-green-500/65', border: 'border-green-300/40' },
  errand: { icon: ShoppingBag, bg: 'bg-cyan-500/50', hover: 'hover:bg-cyan-500/65', border: 'border-cyan-300/40' },
  health: { icon: Heart, bg: 'bg-red-500/50', hover: 'hover:bg-red-500/65', border: 'border-red-300/40' },
  default: { icon: Sparkles, bg: 'bg-schedule/50', hover: 'hover:bg-schedule/65', border: 'border-schedule/40' },
}

function inferCategory(title: string): EventCategory {
  const lower = title.toLowerCase()

  // Work/Focus
  if (/deep work|focus|coding|code|build|develop|work session|programming|ai agent/i.test(lower)) return 'work'

  // Exercise
  if (/exercise|workout|gym|walk|run|stretch|yoga|mobility|fitness|training/i.test(lower)) return 'exercise'

  // Meals
  if (/breakfast|lunch|dinner|meal|eat|food|snack|plant-based/i.test(lower)) return 'meal'

  // Breaks
  if (/break|rest|buffer|transition|relax/i.test(lower)) return 'break'

  // Learning/Reading
  if (/read|learn|study|course|book|research|education/i.test(lower)) return 'learning'

  // Mindfulness
  if (/meditat|mindful|gratitude|journal|reflect|pray|spiritual|morning routine/i.test(lower)) return 'mindfulness'

  // Admin
  if (/email|admin|inbox|follow-up|replies|organize|plan|schedule|review/i.test(lower)) return 'admin'

  // Social/Outreach
  if (/social|meeting|outreach|community|network|connect|reach out|girls/i.test(lower)) return 'social'

  // Creative
  if (/content|video|record|create|design|write|blog|post/i.test(lower)) return 'creative'

  // Podcast
  if (/podcast|listen|audio|robin sharma/i.test(lower)) return 'podcast'

  // Sleep
  if (/sleep|wake|bed|morning|night|wind down/i.test(lower)) return 'sleep'

  // Calls
  if (/call|phone|zoom|meet|standup/i.test(lower)) return 'call'

  // Errands
  if (/errand|shop|grocery|buy|pick up|appointment/i.test(lower)) return 'errand'

  // Health
  if (/doctor|health|wellness|therapy|self-care/i.test(lower)) return 'health'

  return 'default'
}

interface ScheduleGridProps {
  events: ScheduleEvent[]
  googleCalendarEvents?: GoogleCalendarDisplayEvent[]
  selectedDate: Date
  onAddEvent: (startTime: string, endTime: string) => void
  onEditEvent: (event: ScheduleEvent) => void
  onToggleComplete: (eventId: string, completed: boolean) => void
  onResizeEvent?: (eventId: string, newEndTime: string) => void
  onMoveEvent?: (eventId: string, newStartTime: string, newEndTime: string) => void
  wakeTime?: string // Format: "HH:MM" e.g. "07:00"
  bedTime?: string  // Format: "HH:MM" e.g. "22:00"
}

const HOUR_HEIGHT = 60
const DEFAULT_START_HOUR = 4
const DEFAULT_END_HOUR = 22

function parseTimeToHour(time: string | undefined, defaultHour: number): number {
  if (!time) return defaultHour
  const [hours] = time.split(':').map(Number)
  return hours
}

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

function yToMinutes(y: number, gridHeight: number, startHour: number, endHour: number): number {
  const totalMinutes = (endHour - startHour) * 60
  const rawMinutes = (y / gridHeight) * totalMinutes
  // Round to nearest 30 minutes
  return Math.round(rawMinutes / 30) * 30
}

export function ScheduleGrid({ events, googleCalendarEvents = [], selectedDate, onAddEvent, onEditEvent, onToggleComplete, onResizeEvent, onMoveEvent, wakeTime, bedTime }: ScheduleGridProps) {
  // Compute dynamic hours from props
  const START_HOUR = parseTimeToHour(wakeTime, DEFAULT_START_HOUR)
  const END_HOUR = parseTimeToHour(bedTime, DEFAULT_END_HOUR)
  const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [resizingEvent, setResizingEvent] = useState<ScheduleEvent | null>(null)
  const [resizeEndMinutes, setResizeEndMinutes] = useState<number | null>(null)
  const [draggingEvent, setDraggingEvent] = useState<ScheduleEvent | null>(null)
  const [dragEventOffset, setDragEventOffset] = useState<number>(0) // Offset from top of event where user grabbed
  const [dragEventMinutes, setDragEventMinutes] = useState<number | null>(null) // New start time while dragging
  const gridRef = useRef<HTMLDivElement>(null)
  const dragStartTime = useRef<number>(0)
  const eventDragStartTime = useRef<number>(0)

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
  }, [selectedDate, START_HOUR, END_HOUR])

  const getMinutesFromEvent = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent): number => {
    if (!gridRef.current) return 0
    const rect = gridRef.current.getBoundingClientRect()
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? ('changedTouches' in e ? e.changedTouches[0]?.clientY ?? 0 : 0) : e.clientY
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height))
    return yToMinutes(y, rect.height, START_HOUR, END_HOUR)
  }, [START_HOUR, END_HOUR])

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
    const isClick = dragDuration < 200 && Math.abs(endMinutes - dragStart) < 30

    let startMinutes: number
    let finalEndMinutes: number

    if (isClick) {
      // Single click - create 30-minute event
      startMinutes = dragStart
      finalEndMinutes = dragStart + 30
    } else {
      // Drag - create event spanning the drag
      startMinutes = Math.min(dragStart, endMinutes)
      finalEndMinutes = Math.max(dragStart, endMinutes)
      // Ensure minimum 30 minutes
      if (finalEndMinutes - startMinutes < 30) {
        finalEndMinutes = startMinutes + 30
      }
    }

    // Convert to absolute minutes (add START_HOUR offset)
    const absoluteStartMinutes = START_HOUR * 60 + startMinutes
    const absoluteEndMinutes = START_HOUR * 60 + finalEndMinutes

    // Clamp to valid range
    const clampedStart = Math.max(START_HOUR * 60, Math.min(absoluteStartMinutes, END_HOUR * 60 - 30))
    const clampedEnd = Math.min(END_HOUR * 60, Math.max(absoluteEndMinutes, clampedStart + 30))

    const startTime = minutesToTimeString(clampedStart)
    const endTime = minutesToTimeString(clampedEnd)

    onAddEvent(startTime, endTime)

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, getMinutesFromEvent, onAddEvent, START_HOUR, END_HOUR])

  // Touch event handlers (for mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Don't start drag if touching an event
    if ((e.target as HTMLElement).closest('[data-event]')) return

    const minutes = getMinutesFromEvent(e)
    setIsDragging(true)
    setDragStart(minutes)
    setDragEnd(minutes)
    dragStartTime.current = Date.now()
  }, [getMinutesFromEvent])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    e.preventDefault() // Prevent scrolling while dragging
    const minutes = getMinutesFromEvent(e)
    setDragEnd(minutes)
  }, [isDragging, getMinutesFromEvent])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging || dragStart === null) {
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    const endMinutes = getMinutesFromEvent(e)
    const dragDuration = Date.now() - dragStartTime.current
    const isTap = dragDuration < 200 && Math.abs(endMinutes - dragStart) < 30

    let startMinutes: number
    let finalEndMinutes: number

    if (isTap) {
      // Single tap - create 30-minute event
      startMinutes = dragStart
      finalEndMinutes = dragStart + 30
    } else {
      // Drag - create event spanning the drag
      startMinutes = Math.min(dragStart, endMinutes)
      finalEndMinutes = Math.max(dragStart, endMinutes)
      // Ensure minimum 30 minutes
      if (finalEndMinutes - startMinutes < 30) {
        finalEndMinutes = startMinutes + 30
      }
    }

    // Convert to absolute minutes (add START_HOUR offset)
    const absoluteStartMinutes = START_HOUR * 60 + startMinutes
    const absoluteEndMinutes = START_HOUR * 60 + finalEndMinutes

    // Clamp to valid range
    const clampedStart = Math.max(START_HOUR * 60, Math.min(absoluteStartMinutes, END_HOUR * 60 - 30))
    const clampedEnd = Math.min(END_HOUR * 60, Math.max(absoluteEndMinutes, clampedStart + 30))

    const startTime = minutesToTimeString(clampedStart)
    const endTime = minutesToTimeString(clampedEnd)

    onAddEvent(startTime, endTime)

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, getMinutesFromEvent, onAddEvent, START_HOUR, END_HOUR])

  // Add global mouse and touch listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, event: ScheduleEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setResizingEvent(event)
    const endMinutes = timeToMinutes(event.end_time) - START_HOUR * 60
    setResizeEndMinutes(endMinutes)
  }, [START_HOUR])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingEvent || !gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    const minutes = yToMinutes(y, rect.height, START_HOUR, END_HOUR)

    // Ensure minimum 15 minutes duration
    const startMinutes = timeToMinutes(resizingEvent.start_time) - START_HOUR * 60
    const minEndMinutes = startMinutes + 15
    setResizeEndMinutes(Math.max(minutes, minEndMinutes))
  }, [resizingEvent, START_HOUR, END_HOUR])

  const handleResizeEnd = useCallback(() => {
    if (!resizingEvent || resizeEndMinutes === null || !onResizeEvent) {
      setResizingEvent(null)
      setResizeEndMinutes(null)
      return
    }

    const newEndTime = minutesToTimeString(START_HOUR * 60 + resizeEndMinutes)
    onResizeEvent(resizingEvent.id, newEndTime)

    setResizingEvent(null)
    setResizeEndMinutes(null)
  }, [resizingEvent, resizeEndMinutes, onResizeEvent, START_HOUR])

  // Add global mouse listeners for resize
  useEffect(() => {
    if (resizingEvent) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [resizingEvent, handleResizeMove, handleResizeEnd])

  // Event drag handlers (for moving events)
  const handleEventDragStart = useCallback((e: React.MouseEvent, event: ScheduleEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!gridRef.current) return

    const rect = gridRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const clickedMinutes = yToMinutes(y, rect.height, START_HOUR, END_HOUR)
    const eventStartMinutes = timeToMinutes(event.start_time) - START_HOUR * 60

    // Calculate offset from top of event where user clicked
    const offset = clickedMinutes - eventStartMinutes

    setDraggingEvent(event)
    setDragEventOffset(offset)
    setDragEventMinutes(eventStartMinutes)
    eventDragStartTime.current = Date.now()
  }, [START_HOUR, END_HOUR])

  const handleEventDragMove = useCallback((e: MouseEvent) => {
    if (!draggingEvent || !gridRef.current) return

    const rect = gridRef.current.getBoundingClientRect()
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    const minutes = yToMinutes(y, rect.height, START_HOUR, END_HOUR)

    // Adjust for where user grabbed the event
    const newStartMinutes = minutes - dragEventOffset

    // Clamp to valid range
    const eventDuration = timeToMinutes(draggingEvent.end_time) - timeToMinutes(draggingEvent.start_time)
    const maxStart = (END_HOUR - START_HOUR) * 60 - eventDuration
    const clampedStart = Math.max(0, Math.min(newStartMinutes, maxStart))

    // Round to nearest 15 minutes for snapping
    const snappedStart = Math.round(clampedStart / 15) * 15

    setDragEventMinutes(snappedStart)
  }, [draggingEvent, dragEventOffset, START_HOUR, END_HOUR])

  const handleEventDragEnd = useCallback(() => {
    if (!draggingEvent || dragEventMinutes === null || !onMoveEvent) {
      // Check if it was a quick click (not a drag) - open edit modal
      const dragDuration = Date.now() - eventDragStartTime.current
      if (draggingEvent && dragDuration < 200) {
        onEditEvent(draggingEvent)
      }
      setDraggingEvent(null)
      setDragEventMinutes(null)
      setDragEventOffset(0)
      return
    }

    const dragDuration = Date.now() - eventDragStartTime.current
    const originalStartMinutes = timeToMinutes(draggingEvent.start_time) - START_HOUR * 60
    const hasMoved = Math.abs(dragEventMinutes - originalStartMinutes) >= 15

    // If it was a quick click without movement, treat as a click to edit
    if (dragDuration < 200 && !hasMoved) {
      onEditEvent(draggingEvent)
      setDraggingEvent(null)
      setDragEventMinutes(null)
      setDragEventOffset(0)
      return
    }

    // Only update if the event actually moved
    if (hasMoved) {
      const eventDuration = timeToMinutes(draggingEvent.end_time) - timeToMinutes(draggingEvent.start_time)
      const newStartTime = minutesToTimeString(START_HOUR * 60 + dragEventMinutes)
      const newEndTime = minutesToTimeString(START_HOUR * 60 + dragEventMinutes + eventDuration)
      onMoveEvent(draggingEvent.id, newStartTime, newEndTime)
    }

    setDraggingEvent(null)
    setDragEventMinutes(null)
    setDragEventOffset(0)
  }, [draggingEvent, dragEventMinutes, onMoveEvent, onEditEvent, START_HOUR])

  // Add global mouse listeners for event dragging
  useEffect(() => {
    if (draggingEvent) {
      document.addEventListener('mousemove', handleEventDragMove)
      document.addEventListener('mouseup', handleEventDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleEventDragMove)
        document.removeEventListener('mouseup', handleEventDragEnd)
      }
    }
  }, [draggingEvent, handleEventDragMove, handleEventDragEnd])

  const getEventStyle = (event: ScheduleEvent) => {
    // Use drag preview position if this event is being dragged
    const isDragging = draggingEvent?.id === event.id && dragEventMinutes !== null
    const startMinutes = isDragging
      ? START_HOUR * 60 + dragEventMinutes
      : timeToMinutes(event.start_time)
    // Use resize preview if this event is being resized
    const endMinutes = resizingEvent?.id === event.id && resizeEndMinutes !== null
      ? START_HOUR * 60 + resizeEndMinutes
      : isDragging
        ? startMinutes + (timeToMinutes(event.end_time) - timeToMinutes(event.start_time))
        : timeToMinutes(event.end_time)
    const startOffset = startMinutes - START_HOUR * 60
    const duration = endMinutes - startMinutes
    const rawHeight = (duration / 60) * HOUR_HEIGHT
    // Add 2px gap at bottom, enforce minimum height of 28px for readability
    const height = Math.max(rawHeight - 2, 28)

    return {
      top: `${(startOffset / 60) * HOUR_HEIGHT}px`,
      height: `${height}px`,
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
    const duration = Math.max(end - start, 30) // Minimum 30 minutes

    return {
      top: `${(start / 60) * HOUR_HEIGHT}px`,
      height: `${(duration / 60) * HOUR_HEIGHT}px`,
    }
  }

  const dragPreviewStyle = getDragPreviewStyle()

  return (
    <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl overflow-hidden isolate shadow-bevel">
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
          onTouchStart={handleTouchStart}
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
                    const duration = Math.max(end - start, 30)
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
          {events.filter(isEventVisible).map((event) => {
            const isDragging = draggingEvent?.id === event.id
            const displayStartMinutes = isDragging && dragEventMinutes !== null
              ? START_HOUR * 60 + dragEventMinutes
              : timeToMinutes(event.start_time)
            const eventDuration = timeToMinutes(event.end_time) - timeToMinutes(event.start_time)
            const displayEndMinutes = resizingEvent?.id === event.id && resizeEndMinutes !== null
              ? START_HOUR * 60 + resizeEndMinutes
              : isDragging
                ? displayStartMinutes + eventDuration
                : timeToMinutes(event.end_time)
            const duration = displayEndMinutes - displayStartMinutes
            const isShort = duration <= 30
            const category = inferCategory(event.title)
            const style = categoryStyles[category]
            const Icon = style.icon
            const isResizing = resizingEvent?.id === event.id

            return (
              <div
                key={event.id}
                data-event
                className={`absolute left-1 right-1 rounded-xl px-2 z-10 overflow-hidden transition-all backdrop-blur-md border shadow-sm ${
                  isShort ? 'py-0.5' : 'py-1.5'
                } ${style.bg} ${style.hover} ${style.border} ${event.completed ? 'opacity-50' : ''} ${
                  isResizing ? 'ring-2 ring-white/60' : ''
                } ${isDragging ? 'ring-2 ring-white/80 shadow-xl z-30 cursor-grabbing scale-[1.02]' : 'cursor-grab hover:shadow-md'}`}
                style={getEventStyle(event)}
                onMouseDown={(e) => {
                  // Don't start drag from checkbox or resize handle
                  if ((e.target as HTMLElement).closest('button') ||
                      (e.target as HTMLElement).closest('[data-resize-handle]')) return
                  if (onMoveEvent) {
                    handleEventDragStart(e, event)
                  }
                }}
              >
                <div className="flex items-center gap-1.5">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleComplete(event.id, !event.completed)
                    }}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors backdrop-blur-sm ${
                      event.completed
                        ? 'bg-white/80 border-white/80'
                        : 'border-white/70 hover:border-white bg-white/10'
                    }`}
                  >
                    {event.completed && (
                      <Check className="w-3 h-3 text-gray-700" />
                    )}
                  </button>
                  <Icon className={`text-white drop-shadow-sm flex-shrink-0 ${isShort ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <p className={`text-white font-semibold drop-shadow-sm text-[11px] leading-tight ${isShort ? 'truncate' : 'line-clamp-2'} ${event.completed ? 'line-through opacity-70' : ''}`}>
                    {event.title}
                  </p>
                </div>
                {!isShort && (
                  <p className="text-white/90 text-xs truncate ml-10 drop-shadow-sm">
                    {formatTimeDisplay(isDragging ? minutesToTimeString(displayStartMinutes) : event.start_time)} - {formatTimeDisplay(isResizing ? minutesToTimeString(displayEndMinutes) : isDragging ? minutesToTimeString(displayEndMinutes) : event.end_time)}
                  </p>
                )}
                {/* Resize handle */}
                {onResizeEvent && (
                  <div
                    data-resize-handle
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, event)}
                  />
                )}
              </div>
            )
          })}

          {/* Google Calendar Events (read-only) */}
          {googleCalendarEvents.filter(event => {
            if (event.is_all_day) return false
            const startMinutes = timeToMinutes(event.start_time)
            const endMinutes = timeToMinutes(event.end_time)
            return startMinutes < END_HOUR * 60 && endMinutes > START_HOUR * 60
          }).map((event) => {
            const startMinutes = timeToMinutes(event.start_time)
            const endMinutes = timeToMinutes(event.end_time)
            const startOffset = startMinutes - START_HOUR * 60
            const duration = endMinutes - startMinutes
            const rawHeight = (duration / 60) * HOUR_HEIGHT
            const height = Math.max(rawHeight - 2, 28)
            const isShort = duration <= 30

            return (
              <div
                key={`gcal-${event.id}`}
                data-event
                className={`absolute left-1 right-1 rounded-xl px-2 z-5 overflow-hidden backdrop-blur-md border shadow-sm cursor-default ${
                  isShort ? 'py-0.5' : 'py-1.5'
                } bg-white/40 dark:bg-slate-700/40 border-gray-300/50 dark:border-slate-500/50 hover:bg-white/50 dark:hover:bg-slate-700/50`}
                style={{
                  top: `${(startOffset / 60) * HOUR_HEIGHT}px`,
                  height: `${height}px`,
                }}
                title="Google Calendar event (read-only)"
              >
                <div className="flex items-center gap-1.5">
                  {/* Google Calendar icon */}
                  <div className="flex-shrink-0 w-4 h-4 rounded-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" className="text-gray-500 dark:text-slate-400" />
                      <path d="M3 9h18" stroke="currentColor" strokeWidth="2" className="text-gray-500 dark:text-slate-400" />
                      <rect x="7" y="12" width="3" height="3" rx="0.5" className="fill-blue-500" />
                      <rect x="7" y="16" width="3" height="3" rx="0.5" className="fill-green-500" />
                      <rect x="11" y="12" width="3" height="3" rx="0.5" className="fill-yellow-500" />
                      <rect x="11" y="16" width="3" height="3" rx="0.5" className="fill-red-500" />
                    </svg>
                  </div>
                  <p className={`text-gray-700 dark:text-slate-200 font-medium drop-shadow-sm text-[11px] leading-tight ${isShort ? 'truncate' : 'line-clamp-2'}`}>
                    {event.title}
                  </p>
                </div>
                {!isShort && (
                  <p className="text-gray-500 dark:text-slate-400 text-xs truncate ml-5">
                    {formatTimeDisplay(event.start_time)} - {formatTimeDisplay(event.end_time)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
