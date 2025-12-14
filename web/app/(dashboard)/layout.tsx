'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'
import { Calendar, BarChart3, Target, User } from 'lucide-react'
import { FeedbackButton } from '@/components/FeedbackButton'

const navItems = [
  { href: '/today', label: 'Today', icon: Calendar },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, initialized } = useAuthStore()
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/login')
    }
  }, [user, initialized, router])

  // Check onboarding status
  useEffect(() => {
    async function checkOnboarding() {
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single() as { data: { onboarding_completed: boolean } | null }

      if (profile && !profile.onboarding_completed) {
        router.replace('/onboarding')
      } else {
        setOnboardingChecked(true)
      }
    }

    if (initialized && user) {
      checkOnboarding()
    }
  }, [user, initialized, router])

  if (!initialized || !user || !onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-accent"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Logo */}
      <div className="fixed top-4 left-4 z-40">
        <Image
          src="/logo.png"
          alt="DayGo"
          width={36}
          height={36}
          className="rounded-lg"
        />
      </div>

      {/* Feedback Button */}
      <FeedbackButton />

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-3 px-6 transition-colors ${
                  isActive ? 'text-accent' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
