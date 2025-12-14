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
  { name: 'Morning meditation', description: '10 minutes of mindfulness' },
  { name: 'Exercise', description: '30 minutes of physical activity' },
  { name: 'Read', description: 'Read for 20 minutes' },
  { name: 'Drink water', description: '8 glasses throughout the day' },
  { name: 'Journal', description: 'Write down your thoughts' },
  { name: 'No social media', description: 'Avoid scrolling first thing' },
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
    <div className="min-h-screen bg-white dark:bg-navy flex flex-col">
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

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
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
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Track daily habits</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Build consistency with a simple tap</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <Target className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Set meaningful goals</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Link habits to bigger objectives</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <Sparkles className="w-6 h-6 text-mantra flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Stay motivated</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Mantras and AI pep talks to keep you going</p>
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
              <div className="mb-4 space-y-2">
                {selectedHabits.map((habit) => (
                  <div
                    key={habit.name}
                    className="flex items-center justify-between p-3 bg-teal/10 border border-teal/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal" />
                      <span className="font-medium text-gray-900 dark:text-white">{habit.name}</span>
                    </div>
                    <button
                      onClick={() => removeHabit(habit.name)}
                      className="p-1 hover:bg-teal/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-teal" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom habit input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customHabit}
                onChange={(e) => setCustomHabit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomHabit()}
                placeholder="Add your own habit..."
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <button
                onClick={addCustomHabit}
                disabled={!customHabit.trim()}
                className="px-4 py-3 bg-teal hover:bg-teal/90 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Suggested habits */}
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Or choose from suggestions:</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_HABITS.filter(h => !selectedHabits.find(sh => sh.name === h.name)).map((habit) => (
                <button
                  key={habit.name}
                  onClick={() => addHabit(habit)}
                  className="p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-left transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{habit.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{habit.description}</p>
                </button>
              ))}
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
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mantra mb-4 resize-none"
              rows={3}
            />

            {/* Suggested mantras */}
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Or choose a suggestion:</p>
            <div className="space-y-2">
              {SUGGESTED_MANTRAS.map((mantra) => (
                <button
                  key={mantra}
                  onClick={() => {
                    setSelectedMantra(mantra)
                    setCustomMantra('')
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    selectedMantra === mantra
                      ? 'bg-mantra/10 border-2 border-mantra'
                      : 'bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <p className={`italic ${
                    selectedMantra === mantra
                      ? 'text-mantra'
                      : 'text-gray-700 dark:text-slate-300'
                  }`}>
                    &ldquo;{mantra}&rdquo;
                  </p>
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
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-teal" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Today</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Track your daily habits, mantras, and journal</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Dashboard</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">View your progress and streaks over time</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Goals</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Set big goals and link habits to them</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600 dark:text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Profile</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Manage settings and subscription</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-navy to-transparent">
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
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
