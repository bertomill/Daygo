'use client'

import { useState } from 'react'
import {
  Diamond,
  DollarSign,
  Dumbbell,
  Heart,
  Sun,
  BookOpen,
  Brain,
  Zap,
  Rocket,
  TreePine,
  Flower2,
  Hammer,
  Trophy,
  Users,
  Moon,
  PenLine,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ScheduleBlock {
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
    title: 'Financial Freedom',
    subtitle: 'Build wealth that works for you',
    gradient: 'from-emerald-400 to-teal-500',
    bgGlow: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    emoji: '🏆',
    title: 'World-Class Fitness',
    subtitle: 'Train like a champion every day',
    gradient: 'from-orange-400 to-red-500',
    bgGlow: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    emoji: '❤️',
    title: 'Strongest Relationships',
    subtitle: 'Deep, rewarding connections',
    gradient: 'from-pink-400 to-rose-500',
    bgGlow: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
]

const schedule: ScheduleBlock[] = [
  {
    time: '6:00 AM',
    title: 'Meditate',
    intensifier: "Don't just meditate — go full out with loving kindness. Feel it in every cell.",
    icon: Sun,
    color: 'text-amber-500',
    gradient: 'from-amber-500/10 to-yellow-500/5',
  },
  {
    time: '6:30 AM',
    title: 'Journal',
    intensifier: "Don't just journal — get extremely clear on where you are going. Crystallize your vision.",
    icon: PenLine,
    color: 'text-violet-500',
    gradient: 'from-violet-500/10 to-purple-500/5',
  },
  {
    time: '6:40 AM',
    title: 'Read',
    intensifier: "Don't just read — get extremely focused on every word. Download wisdom into your mind.",
    icon: BookOpen,
    color: 'text-blue-500',
    gradient: 'from-blue-500/10 to-indigo-500/5',
  },
  {
    time: '7:00 AM',
    endTime: '8:00 AM',
    title: 'Create Content at Lighten AI',
    intensifier: "Don't just create content — create crack. The kind people will watch again and again.",
    icon: Zap,
    color: 'text-fuchsia-500',
    gradient: 'from-fuchsia-500/10 to-pink-500/5',
  },
  {
    time: '8:00 AM',
    endTime: '9:00 AM',
    title: 'AI Course Deep Dive',
    intensifier: "Don't just watch — deeply understand every concept so you can apply it to your work.",
    icon: Brain,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/10 to-sky-500/5',
  },
  {
    time: '9:00 AM',
    endTime: '12:00 PM',
    title: 'Build',
    intensifier: "Don't just build — create something absolutely awesome. Ship what matters.",
    icon: Rocket,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/10 to-blue-500/5',
  },
  {
    time: '12:00 PM',
    endTime: '1:00 PM',
    title: 'Walk & Get Flowers',
    intensifier: "Don't just walk — do vigorous breathing walking. Move with power, love with intention.",
    icon: Flower2,
    color: 'text-rose-500',
    gradient: 'from-rose-500/10 to-pink-500/5',
  },
  {
    time: '1:00 PM',
    endTime: '4:00 PM',
    title: '3 Hours of Power — Build',
    intensifier: "Don't just work — create something that's going to drop jaws. This is your masterpiece time.",
    icon: Hammer,
    color: 'text-orange-500',
    gradient: 'from-orange-500/10 to-amber-500/5',
  },
  {
    time: '4:00 PM',
    endTime: '6:00 PM',
    title: '2-Hour Workout',
    intensifier: "That's your power. That's your charge up. That's how you win. Train like a world champion.",
    icon: Trophy,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/10 to-green-500/5',
  },
  {
    time: '6:00 PM',
    endTime: '9:00 PM',
    title: 'Community Time',
    intensifier: "Don't just be in the community — be on your absolute A-game in terms of connection building.",
    icon: Users,
    color: 'text-sky-500',
    gradient: 'from-sky-500/10 to-blue-500/5',
  },
  {
    time: '10:00 PM',
    title: 'Wash Up',
    intensifier: "Be extremely intentional about getting ready for the best possible sleep. This is recovery.",
    icon: Moon,
    color: 'text-slate-400',
    gradient: 'from-slate-400/10 to-slate-500/5',
  },
  {
    time: '10:10 PM',
    title: 'Journal',
    intensifier: "Be extremely intentional about getting clear on your goals. Write the future into existence.",
    icon: Sparkles,
    color: 'text-violet-400',
    gradient: 'from-violet-400/10 to-purple-400/5',
  },
  {
    time: '10:15 PM',
    title: 'Read',
    intensifier: "Download every word of wisdom into your mindset. Let the last thing you consume shape your dreams.",
    icon: BookOpen,
    color: 'text-indigo-400',
    gradient: 'from-indigo-400/10 to-blue-400/5',
  },
]

function ScheduleCard({ block, index }: { block: ScheduleBlock; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = block.icon

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
        onClick={() => setExpanded(!expanded)}
        className={`relative flex gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200
          bg-gradient-to-r ${block.gradient}
          hover:shadow-bevel-md hover:-translate-y-0.5
          border border-transparent hover:border-white/40 dark:hover:border-slate-700/50
        `}
      >
        {/* Icon circle */}
        <div className={`flex-shrink-0 w-[48px] h-[48px] rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-bevel-sm`}>
          <Icon className={`w-5 h-5 ${block.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-bevel-text-secondary dark:text-slate-400">
                {block.time}{block.endTime ? ` — ${block.endTime}` : ''}
              </span>
              <h3 className="text-[15px] font-bold text-bevel-text dark:text-white mt-0.5 leading-tight">
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

          {/* Intensifier - expandable */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              expanded ? 'max-h-40 opacity-100 mt-2.5' : 'max-h-0 opacity-0'
            }`}
          >
            <p className="text-[13px] leading-relaxed text-bevel-text-secondary dark:text-slate-400 italic font-medium">
              &ldquo;{block.intensifier}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CrystalDayPage() {
  const [showAllBlocks, setShowAllBlocks] = useState(true)

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
            <ScheduleCard key={`${block.time}-${block.title}`} block={block} index={index} />
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
