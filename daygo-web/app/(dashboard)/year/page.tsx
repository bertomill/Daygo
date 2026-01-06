'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ArrowLeft, Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { journalService } from '@/lib/services/journal'
import type { JournalEntry, JournalPrompt } from '@/lib/types/database'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getYearCalendarData(year: number) {
  const weeks: { date: Date; inYear: boolean }[][] = []
  const firstDay = new Date(year, 0, 1)
  const lastDay = new Date(year, 11, 31)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  let currentDate = new Date(startDate)
  let currentWeek: { date: Date; inYear: boolean }[] = []

  while (currentDate <= endDate) {
    currentWeek.push({
      date: new Date(currentDate),
      inYear: currentDate.getFullYear() === year,
    })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return weeks
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Strip HTML tags from string
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function YearPage() {
  const { user } = useAuthStore()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Zoom and pan state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['year-entries', user?.id, selectedYear],
    queryFn: () => journalService.getEntriesForYear(user!.id, selectedYear),
    enabled: !!user,
  })

  // Filter to only highlight entries
  const highlightEntries = entries.filter(
    (e) => e.prompt?.prompt?.toLowerCase().includes('highlight')
  )

  // Create a map of dates to entries for quick lookup
  const entriesByDate = new Map<string, (JournalEntry & { prompt: JournalPrompt })[]>()
  highlightEntries.forEach((entry) => {
    const existing = entriesByDate.get(entry.date) || []
    entriesByDate.set(entry.date, [...existing, entry])
  })

  const calendarWeeks = getYearCalendarData(selectedYear)

  // Group entries by month for the list view
  const entriesByMonth = new Map<number, (JournalEntry & { prompt: JournalPrompt })[]>()
  highlightEntries.forEach((entry) => {
    const month = new Date(entry.date).getMonth()
    const existing = entriesByMonth.get(month) || []
    entriesByMonth.set(month, [...existing, entry])
  })

  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate)?.[0] : null

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 0.5))
  }, [])

  const handleReset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Mouse/touch drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [scale, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch handlers for pinch zoom
  const lastTouchDistance = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy)
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      })
    }
  }, [scale, position])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const delta = distance - lastTouchDistance.current
      setScale((s) => Math.min(Math.max(s + delta * 0.005, 0.5), 3))
      lastTouchDistance.current = distance
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }, [isDragging, dragStart])

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null
    setIsDragging(false)
  }, [])

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale((s) => Math.min(Math.max(s + delta, 0.5), 3))
    }
  }, [])

  // Reset position when scale returns to 1
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale])

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/today"
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Year in Review
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Your daily highlights at a glance
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
              <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[60px] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-gray-400 dark:text-slate-500">Loading your year...</div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Zoom Controls */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {scale > 1 ? 'Drag to pan • ' : ''}Pinch or Ctrl+scroll to zoom
            </p>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600 dark:text-slate-300" />
              </button>
              <span className="text-sm text-gray-600 dark:text-slate-300 min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-gray-600 dark:text-slate-300" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors ml-1"
                title="Reset view"
              >
                <RotateCcw className="w-4 h-4 text-gray-600 dark:text-slate-300" />
              </button>
            </div>
          </div>

          {/* Heatmap Calendar - Full Width */}
          <div
            ref={containerRef}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 overflow-hidden"
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <div
              ref={contentRef}
              className="p-6 transition-transform origin-center"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              }}
            >
              {/* Month labels */}
              <div className="flex mb-3">
                <div className="w-8 flex-shrink-0" />
                {MONTHS.map((month) => (
                  <div
                    key={month}
                    className="flex-1 text-sm font-medium text-gray-600 dark:text-slate-300 text-center"
                  >
                    {month}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="flex gap-[3px]">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] mr-2 flex-shrink-0">
                  {DAYS.map((day, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 text-xs text-gray-500 dark:text-slate-400 flex items-center justify-center"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => {
                      const dateStr = formatDate(day.date)
                      const hasEntry = entriesByDate.has(dateStr)
                      const isSelected = selectedDate === dateStr
                      const isToday = dateStr === formatDate(new Date())

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => hasEntry && setSelectedDate(isSelected ? null : dateStr)}
                          disabled={!day.inYear || !hasEntry}
                          className={`w-6 h-6 rounded transition-all ${
                            !day.inYear
                              ? 'bg-transparent'
                              : hasEntry
                              ? isSelected
                                ? 'bg-accent ring-2 ring-accent/50 ring-offset-1 dark:ring-offset-slate-800'
                                : 'bg-accent/80 hover:bg-accent hover:scale-110 cursor-pointer'
                              : 'bg-gray-100 dark:bg-slate-700/50'
                          } ${isToday && day.inYear ? 'ring-2 ring-gray-400 dark:ring-slate-400' : ''}`}
                          title={day.inYear ? `${dateStr}${hasEntry ? ' - Has highlight' : ''}` : undefined}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-3 mt-6 text-sm text-gray-500 dark:text-slate-400">
                <span>Less</span>
                <div className="w-4 h-4 rounded bg-gray-100 dark:bg-slate-700/50" />
                <div className="w-4 h-4 rounded bg-accent/30" />
                <div className="w-4 h-4 rounded bg-accent/60" />
                <div className="w-4 h-4 rounded bg-accent" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Selected Day Detail */}
          {selectedEntry && (
            <div className="bg-accent/10 dark:bg-accent/20 rounded-2xl p-6 mb-6 border border-accent/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-accent font-medium mb-1">
                    {new Date(selectedEntry.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-900 dark:text-white">{stripHtml(selectedEntry.entry)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 text-center border border-gray-200 dark:border-slate-700">
              <p className="text-3xl font-bold text-accent">{highlightEntries.length}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Highlights</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 text-center border border-gray-200 dark:border-slate-700">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {entriesByMonth.size}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Months Active</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 text-center border border-gray-200 dark:border-slate-700">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round((highlightEntries.length / 365) * 100)}%
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Days Captured</p>
            </div>
          </div>

          {/* Monthly Highlights */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Monthly Highlights
            </h2>
            {Array.from(entriesByMonth.entries())
              .sort((a, b) => b[0] - a[0])
              .map(([month, monthEntries]) => (
                <div key={month} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {MONTHS[month]} {selectedYear}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {monthEntries.length} highlight{monthEntries.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {monthEntries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry) => (
                        <div key={entry.id} className="px-5 py-4">
                          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-gray-900 dark:text-white">{stripHtml(entry.entry)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

            {highlightEntries.length === 0 && (
              <div className="text-center py-16">
                <Sparkles className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-lg text-gray-500 dark:text-slate-400 mb-2">
                  No highlights recorded for {selectedYear}
                </p>
                <p className="text-gray-400 dark:text-slate-500">
                  Add a "Highlight of my day" journal prompt to start capturing your best moments
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
