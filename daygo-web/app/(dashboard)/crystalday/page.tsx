'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Diamond,
  Sun,
  BookOpen,
  Brain,
  Zap,
  Rocket,
  Flower2,
  Hammer,
  Trophy,
  Users,
  Moon,
  PenLine,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { crystalDayLogsService, type CrystalDayLog } from '@/lib/services/crystalDayLogs'

interface ScheduleBlock {
  key: string
  time: string
  endTime?: string
  title: string
  intensifier: string
  icon: LucideIcon
  color: string
  gradient: string
}

const pillars = [
  {
    emoji: '💰',
    title: 'Match Salary with Lighten AI',
    subtitle: 'Hit $7K/month — your next step to financial freedom & career fulfillment',
    gradient: 'from-emerald-400 to-teal-500',
    bgGlow: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    emoji: '🏆',
    title: 'Sweden Hyrox Worlds',
    subtitle: 'Make it to the World Championships — your next step in character & influence',
    gradient: 'from-orange-400 to-red-500',
    bgGlow: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    emoji: '🚀',
    title: 'MakersLounge to 10K',
    subtitle: '10K Slack members — encourage people to build & thrive',
    gradient: 'from-pink-400 to-rose-500',
    bgGlow: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
]

const schedule: ScheduleBlock[] = [
  {
    key: 'meditate',
    time: '6:00 AM',
    title: 'Meditate',
    intensifier: "Don't just meditate — go full out with loving kindness. Feel it in every cell.",
    icon: Sun,
    color: 'text-amber-500',
    gradient: 'from-amber-500/10 to-yellow-500/5',
  },
  {
    key: 'journal-morning',
    time: '6:30 AM',
    title: 'Journal',
    intensifier: "Don't just journal — get extremely clear on where you are going. Crystallize your vision.",
    icon: PenLine,
    color: 'text-violet-500',
    gradient: 'from-violet-500/10 to-purple-500/5',
  },
  {
    key: 'read-morning',
    time: '6:40 AM',
    title: 'Read',
    intensifier: "Don't just read — get extremely focused on every word. Download wisdom into your mind.",
    icon: BookOpen,
    color: 'text-blue-500',
    gradient: 'from-blue-500/10 to-indigo-500/5',
  },
  {
    key: 'content',
    time: '7:00 AM',
    endTime: '8:00 AM',
    title: 'Create Content at Lighten AI',
    intensifier: "Don't just create content — create crack. The kind people will watch again and again.",
    icon: Zap,
    color: 'text-fuchsia-500',
    gradient: 'from-fuchsia-500/10 to-pink-500/5',
  },
  {
    key: 'ai-course',
    time: '8:00 AM',
    endTime: '9:00 AM',
    title: 'AI Course Deep Dive',
    intensifier: "Don't just watch — deeply understand every concept so you can apply it to your work.",
    icon: Brain,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/10 to-sky-500/5',
  },
  {
    key: 'build-morning',
    time: '9:00 AM',
    endTime: '12:00 PM',
    title: 'Build',
    intensifier: "Don't just build — create something absolutely awesome. Ship what matters.",
    icon: Rocket,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/10 to-blue-500/5',
  },
  {
    key: 'walk',
    time: '12:00 PM',
    endTime: '1:00 PM',
    title: 'Walk & Get Flowers',
    intensifier: "Don't just walk — do vigorous breathing walking. Move with power, love with intention.",
    icon: Flower2,
    color: 'text-rose-500',
    gradient: 'from-rose-500/10 to-pink-500/5',
  },
  {
    key: 'build-afternoon',
    time: '1:00 PM',
    endTime: '4:00 PM',
    title: '3 Hours of Power — Build',
    intensifier: "Don't just work — create something that's going to drop jaws. This is your masterpiece time.",
    icon: Hammer,
    color: 'text-orange-500',
    gradient: 'from-orange-500/10 to-amber-500/5',
  },
  {
    key: 'workout',
    time: '4:00 PM',
    endTime: '6:00 PM',
    title: '2-Hour Workout',
    intensifier: "That's your power. That's your charge up. That's how you win. Train like a world champion.",
    icon: Trophy,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/10 to-green-500/5',
  },
  {
    key: 'community',
    time: '6:00 PM',
    endTime: '9:00 PM',
    title: 'Community Time',
    intensifier: "Don't just be in the community — be on your absolute A-game in terms of connection building.",
    icon: Users,
    color: 'text-sky-500',
    gradient: 'from-sky-500/10 to-blue-500/5',
  },
  {
    key: 'wash-up',
    time: '10:00 PM',
    title: 'Wash Up',
    intensifier: "Be extremely intentional about getting ready for the best possible sleep. This is recovery.",
    icon: Moon,
    color: 'text-slate-400',
    gradient: 'from-slate-400/10 to-slate-500/5',
  },
  {
    key: 'journal-evening',
    time: '10:10 PM',
    title: 'Journal',
    intensifier: "Be extremely intentional about getting clear on your goals. Write the future into existence.",
    icon: Sparkles,
    color: 'text-violet-400',
    gradient: 'from-violet-400/10 to-purple-400/5',
  },
  {
    key: 'read-evening',
    time: '10:15 PM',
    title: 'Read',
    intensifier: "Download every word of wisdom into your mindset. Let the last thing you consume shape your dreams.",
    icon: BookOpen,
    color: 'text-indigo-400',
    gradient: 'from-indigo-400/10 to-blue-400/5',
  },
]

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = d.getTime() - today.getTime()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === -1) return 'Yesterday'
  if (days === 1) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function ScheduleCard({
  block,
  index,
  log,
  onToggle,
  onNoteChange,
}: {
  block: ScheduleBlock
  index: number
  log: CrystalDayLog | undefined
  onToggle: (key: string, completed: boolean) => void
  onNoteChange: (key: string, note: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = block.icon
  const completed = log?.completed ?? false
  const note = log?.note ?? ''
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNoteInput = useCallback(
    (value: string) => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
      noteTimerRef.current = setTimeout(() => {
        onNoteChange(block.key, value)
      }, 600)
    },
    [block.key, onNoteChange]
  )

  useEffect(() => {
    return () => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
    }
  }, [])

  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
    >
      {/* Timeline connector */}
      {index < schedule.length - 1 && (
        <div className="absolute left-[23px] top-[52px] bottom-[-12px] w-[2px] bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700" />
      )}

      <div
        className={`relative flex gap-4 p-4 rounded-2xl transition-all duration-200
          bg-gradient-to-r ${block.gradient}
          hover:shadow-bevel-md hover:-translate-y-0.5
          border border-transparent hover:border-white/40 dark:hover:border-slate-700/50
          ${completed ? 'opacity-60' : ''}
        `}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(block.key, !completed)
          }}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-3
            ${
              completed
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-brand-400'
            }
          `}
        >
          {completed && <Check className="w-3.5 h-3.5" />}
        </button>

        {/* Icon circle */}
        <div className={`flex-shrink-0 w-[48px] h-[48px] rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-bevel-sm`}>
          <Icon className={`w-5 h-5 ${block.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-bevel-text-secondary dark:text-slate-400">
                {block.time}{block.endTime ? ` — ${block.endTime}` : ''}
              </span>
              <h3 className={`text-[15px] font-bold text-bevel-text dark:text-white mt-0.5 leading-tight ${completed ? 'line-through' : ''}`}>
                {block.title}
              </h3>
            </div>
            <div className="flex-shrink-0 ml-2">
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-bevel-text-secondary dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-bevel-text-secondary dark:text-slate-400" />
              )}
            </div>
          </div>

          {/* Expandable content: intensifier + note */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              expanded ? 'max-h-60 opacity-100 mt-2.5' : 'max-h-0 opacity-0'
            }`}
          >
            <p className="text-[13px] leading-relaxed text-bevel-text-secondary dark:text-slate-400 italic font-medium">
              &ldquo;{block.intensifier}&rdquo;
            </p>
            <textarea
              defaultValue={note}
              onChange={(e) => handleNoteInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add a note..."
              rows={2}
              className="mt-2 w-full text-[13px] leading-relaxed text-bevel-text dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CrystalDayPage() {
  const [showAllBlocks, setShowAllBlocks] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const dateStr = formatDate(selectedDate)

  const { data: logs = [] } = useQuery({
    queryKey: ['crystal-day-logs', user?.id, dateStr],
    queryFn: () => crystalDayLogsService.getLogs(user!.id, dateStr),
    enabled: !!user,
  })

  const logMap = new Map(logs.map((l) => [l.item_key, l]))

  const completedCount = logs.filter((l) => l.completed).length

  const upsertMutation = useMutation({
    mutationFn: ({ itemKey, updates }: { itemKey: string; updates: { completed?: boolean; note?: string | null } }) =>
      crystalDayLogsService.upsertLog(user!.id, dateStr, itemKey, updates),
    onMutate: async ({ itemKey, updates }) => {
      const queryKey = ['crystal-day-logs', user?.id, dateStr]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CrystalDayLog[]>(queryKey)

      queryClient.setQueryData<CrystalDayLog[]>(queryKey, (old = []) => {
        const existing = old.find((l) => l.item_key === itemKey)
        if (existing) {
          return old.map((l) =>
            l.item_key === itemKey ? { ...l, ...updates } : l
          )
        }
        return [
          ...old,
          {
            id: `temp-${itemKey}`,
            user_id: user!.id,
            date: dateStr,
            item_key: itemKey,
            completed: updates.completed ?? false,
            note: updates.note ?? null,
            created_at: new Date().toISOString(),
          },
        ]
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['crystal-day-logs', user?.id, dateStr], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crystal-day-logs', user?.id, dateStr] })
    },
  })

  const handleToggle = useCallback(
    (key: string, completed: boolean) => {
      upsertMutation.mutate({ itemKey: key, updates: { completed } })
    },
    [upsertMutation]
  )

  const handleNoteChange = useCallback(
    (key: string, note: string) => {
      upsertMutation.mutate({ itemKey: key, updates: { note: note || null } })
    },
    [upsertMutation]
  )

  const goToPrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-16 pb-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 shadow-bevel-md mb-4">
          <Diamond className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-bevel-text dark:text-white tracking-tight">
          Crystal Day
        </h1>
        <p className="text-sm text-bevel-text-secondary dark:text-slate-400 mt-1 font-medium">
          The 2026 Blueprint — Every day, no exceptions.
        </p>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={goToPrevDay}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-bevel-text dark:text-white">
            {formatDisplayDate(selectedDate)}
          </span>
          <div className="text-xs text-bevel-text-secondary dark:text-slate-400 mt-0.5">
            {completedCount}/{schedule.length} completed
          </div>
        </div>
        <button
          onClick={goToNextDay}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-bevel-text-secondary dark:text-slate-400" />
        </button>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {pillars.map((pillar, i) => (
          <div
            key={pillar.title}
            className={`relative rounded-2xl p-3.5 text-center ${pillar.bgGlow} border ${pillar.border}
              backdrop-blur-sm transition-all hover:scale-[1.02] animate-fade-in`}
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
          >
            <span className="text-2xl block mb-1.5">{pillar.emoji}</span>
            <h3 className="text-[11px] font-bold text-bevel-text dark:text-white leading-tight">
              {pillar.title}
            </h3>
            <p className="text-[9px] text-bevel-text-secondary dark:text-slate-500 mt-0.5 leading-snug">
              {pillar.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Schedule Timeline */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header text-bevel-text-secondary dark:text-slate-400">
            Daily Schedule
          </h2>
          <button
            onClick={() => setShowAllBlocks(!showAllBlocks)}
            className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            {showAllBlocks ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        <div className="space-y-3">
          {schedule.map((block, index) => (
            <ScheduleCard
              key={block.key}
              block={block}
              index={index}
              log={logMap.get(block.key)}
              onToggle={handleToggle}
              onNoteChange={handleNoteChange}
            />
          ))}
        </div>
      </div>

      {/* Footer mantra */}
      <div className="text-center py-8 animate-fade-in" style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}>
        <div className="inline-block px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-500/5 via-brand-500/10 to-brand-500/5 border border-brand-500/10">
          <p className="text-sm font-bold text-bevel-text dark:text-white">
            Crystal clear. No compromise. Every single day.
          </p>
        </div>
      </div>
    </div>
  )
}
