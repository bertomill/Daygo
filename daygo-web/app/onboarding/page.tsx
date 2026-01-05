'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  Sparkles,
  Target,
  CheckCircle2,
  Calendar,
  BarChart3,
  User,
  ArrowRight,
  Plus,
  X,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { habitsService } from '@/lib/services/habits'
import { mantrasService } from '@/lib/services/mantras'
import { supabase } from '@/lib/supabase'

const STEPS = ['welcome', 'habits', 'mantra', 'tour'] as const
type Step = typeof STEPS[number]

const SUGGESTED_HABITS = [
  { name: 'Morning meditation', description: '10 minutes of mindfulness', icon: Sparkles, color: 'bg-teal' },
  { name: 'Exercise', description: '30 minutes of physical activity', icon: Target, color: 'bg-bevel-red' },
  { name: 'Read', description: 'Read for 20 minutes', icon: CheckCircle2, color: 'bg-bevel-blue' },
  { name: 'Drink water', description: '8 glasses throughout the day', icon: User, color: 'bg-cyan-500' },
  { name: 'Journal', description: 'Write down your thoughts', icon: Calendar, color: 'bg-bevel-yellow' },
  { name: 'No social media', description: 'Avoid scrolling first thing', icon: BarChart3, color: 'bg-purple-500' },
]

const SUGGESTED_MANTRAS = [
  "I am capable of achieving my goals",
  "Every day is a fresh start",
  "Progress, not perfection",
  "I choose to focus on what I can control",
  "Small steps lead to big changes",
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [selectedHabits, setSelectedHabits] = useState<{ name: string; description?: string }[]>([])
  const [customHabit, setCustomHabit] = useState('')
  const [selectedMantra, setSelectedMantra] = useState('')
  const [customMantra, setCustomMantra] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStepIndex = STEPS.indexOf(currentStep)

  const createHabitMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      habitsService.createHabit(user!.id, name, description),
  })

  const createMantraMutation = useMutation({
    mutationFn: (text: string) => mantrasService.createMantra(user!.id, text),
  })

  const completeOnboarding = async () => {
    if (!user) return
    setIsSubmitting(true)

    try {
      // Create selected habits
      for (const habit of selectedHabits) {
        await createHabitMutation.mutateAsync(habit)
      }

      // Create mantra if selected
      const mantraText = customMantra || selectedMantra
      if (mantraText) {
        await createMantraMutation.mutateAsync(mantraText)
      }

      // Mark onboarding as complete
      await (supabase
        .from('profiles') as any)
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      // Set flag to show the add hint on first visit
      localStorage.setItem('daygo-just-onboarded', 'true')
      router.push('/today')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex])
    } else {
      completeOnboarding()
    }
  }

  const handleSkip = async () => {
    if (!user) return
    setIsSubmitting(true)

    await (supabase
      .from('profiles') as any)
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    // Set flag to show the add hint on first visit
    localStorage.setItem('daygo-just-onboarded', 'true')
    router.push('/today')
  }

  const addHabit = (habit: { name: string; description?: string }) => {
    if (!selectedHabits.find(h => h.name === habit.name)) {
      setSelectedHabits([...selectedHabits, habit])
    }
  }

  const removeHabit = (name: string) => {
    setSelectedHabits(selectedHabits.filter(h => h.name !== name))
  }

  const addCustomHabit = () => {
    if (customHabit.trim()) {
      addHabit({ name: customHabit.trim() })
      setCustomHabit('')
    }
  }

  return (
    <div className="min-h-screen bg-bevel-bg dark:bg-slate-900 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-800">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-sm transition-colors"
        >
          Skip for now
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pb-32 overflow-y-auto pt-8">
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="max-w-md text-center animate-fade-in">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to DayGo
            </h1>
            <p className="text-gray-600 dark:text-slate-400 text-lg mb-8">
              Build better habits, track your goals, and become the best version of yourself.
            </p>
            <div className="space-y-3 text-left mb-8">
              <div className="flex items-center gap-4 p-5 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel">
                <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-bevel-text dark:text-white">Track daily habits</p>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400">Build consistency with a simple tap</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-bevel-text dark:text-white">Set meaningful goals</p>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400">Link habits to bigger objectives</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel">
                <div className="w-14 h-14 bg-mantra rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-bevel-text dark:text-white">Stay motivated</p>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400">Mantras and AI pep talks to keep you going</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Habits Step */}
        {currentStep === 'habits' && (
          <div className="max-w-md w-full animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-teal" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add your first habits
              </h2>
              <p className="text-gray-500 dark:text-slate-400">
                Start with 1-3 habits you want to build. You can always add more later.
              </p>
            </div>

            {/* Selected habits */}
            {selectedHabits.length > 0 && (
              <div className="mb-6 space-y-3">
                {selectedHabits.map((habit) => (
                  <div
                    key={habit.name}
                    className="flex items-center justify-between p-4 bg-teal/10 dark:bg-teal/20 rounded-2xl shadow-bevel-sm ring-2 ring-teal/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-bevel-text dark:text-white">{habit.name}</span>
                    </div>
                    <button
                      onClick={() => removeHabit(habit.name)}
                      className="p-2 hover:bg-teal/20 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-teal dark:text-teal" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom habit input */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={customHabit}
                onChange={(e) => setCustomHabit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomHabit()}
                placeholder="Add your own habit..."
                className="flex-1 px-5 py-4 bg-bevel-card dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-bevel-text dark:text-white placeholder-bevel-text-secondary dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal shadow-bevel-sm"
              />
              <button
                onClick={addCustomHabit}
                disabled={!customHabit.trim()}
                className="px-5 py-4 bg-teal hover:bg-teal/90 disabled:opacity-50 text-white rounded-2xl transition-all shadow-bevel hover:shadow-bevel-md"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Suggested habits */}
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Or choose from suggestions:</p>
            <div className="space-y-3">
              {SUGGESTED_HABITS.filter(h => !selectedHabits.find(sh => sh.name === h.name)).map((habit) => {
                const Icon = habit.icon
                return (
                  <button
                    key={habit.name}
                    onClick={() => addHabit(habit)}
                    className="w-full flex items-center gap-4 p-4 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel hover:shadow-bevel-md transition-all text-left group"
                  >
                    <div className={`w-16 h-16 ${habit.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-bevel-text dark:text-white">{habit.name}</p>
                      <p className="text-sm text-bevel-text-secondary dark:text-slate-400">{habit.description}</p>
                    </div>
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded-full group-hover:border-teal transition-colors" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Mantra Step */}
        {currentStep === 'mantra' && (
          <div className="max-w-md w-full animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-mantra/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-mantra" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add a daily mantra
              </h2>
              <p className="text-gray-500 dark:text-slate-400">
                A personal affirmation to inspire you each day. This is optional.
              </p>
            </div>

            {/* Custom mantra input */}
            <textarea
              value={customMantra}
              onChange={(e) => {
                setCustomMantra(e.target.value)
                setSelectedMantra('')
              }}
              placeholder="Write your own mantra..."
              className="w-full px-5 py-4 bg-bevel-card dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-bevel-text dark:text-white placeholder-bevel-text-secondary dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mantra focus:border-mantra mb-6 resize-none shadow-bevel-sm"
              rows={3}
            />

            {/* Suggested mantras */}
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Or choose a suggestion:</p>
            <div className="space-y-3">
              {SUGGESTED_MANTRAS.map((mantra) => (
                <button
                  key={mantra}
                  onClick={() => {
                    setSelectedMantra(mantra)
                    setCustomMantra('')
                  }}
                  className={`w-full p-5 rounded-2xl text-left transition-all group ${
                    selectedMantra === mantra
                      ? 'bg-mantra/10 dark:bg-mantra/20 shadow-bevel-md ring-2 ring-mantra/30'
                      : 'bg-bevel-card dark:bg-slate-800 shadow-bevel hover:shadow-bevel-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedMantra === mantra ? 'bg-mantra' : 'bg-mantra/10'
                    }`}>
                      <Sparkles className={`w-6 h-6 ${
                        selectedMantra === mantra ? 'text-white' : 'text-mantra'
                      }`} />
                    </div>
                    <p className={`italic flex-1 ${
                      selectedMantra === mantra
                        ? 'text-mantra dark:text-mantra font-medium'
                        : 'text-bevel-text dark:text-slate-300'
                    }`}>
                      &ldquo;{mantra}&rdquo;
                    </p>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      selectedMantra === mantra
                        ? 'bg-mantra border-mantra'
                        : 'border-gray-300 dark:border-slate-600 group-hover:border-mantra'
                    }`}>
                      {selectedMantra === mantra && (
                        <CheckCircle2 className="w-full h-full text-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tour Step */}
        {currentStep === 'tour' && (
          <div className="max-w-md w-full animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You&apos;re all set!
              </h2>
              <p className="text-gray-500 dark:text-slate-400">
                Here&apos;s a quick overview of where everything is.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-5 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel">
                <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-bevel-text dark:text-white">Today</p>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400">Track your daily habits, mantras, and journal</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>

              <div className="flex items-center gap-4 p-5 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-bevel-text dark:text-white">Dashboard</p>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400">View your progress and streaks over time</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>

              <div className="flex items-center gap-4 p-5 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel">
                <div className="w-14 h-14 bg-success rounded-full flex items-center justify-center">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-bevel-text dark:text-white">Goals</p>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400">Set big goals and link habits to them</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>

              <div className="flex items-center gap-4 p-5 bg-bevel-card dark:bg-slate-800 rounded-2xl shadow-bevel">
                <div className="w-14 h-14 bg-bevel-blue rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-bevel-text dark:text-white">Profile</p>
                  <p className="text-sm text-bevel-text-secondary dark:text-slate-400">Manage settings and subscription</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-bevel-bg dark:from-slate-900 via-bevel-bg/80 dark:via-slate-900/80 to-transparent">
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-2xl font-semibold transition-all shadow-bevel-md hover:shadow-bevel-lg"
        >
          {isSubmitting ? (
            'Setting up...'
          ) : currentStep === 'tour' ? (
            <>
              Get Started
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
