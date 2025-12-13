'use client'

import { useRouter } from 'next/navigation'
import { User, HelpCircle, Shield, LogOut, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useThemeStore } from '@/lib/theme-store'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile</h1>

      {/* User Info */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-accent" />
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">DayGo Member</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden mb-6 shadow-sm">
        <a
          href="mailto:support@daygo.app"
          className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-gray-400 dark:text-slate-400" />
          <span className="text-gray-900 dark:text-white">Help & Support</span>
        </a>
        <div className="border-t border-gray-200 dark:border-slate-700" />
        <a
          href="/privacy"
          target="_blank"
          className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Shield className="w-5 h-5 text-gray-400 dark:text-slate-400" />
          <span className="text-gray-900 dark:text-white">Privacy Policy</span>
        </a>
      </div>

      {/* Dark Mode Toggle */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-gray-400 dark:text-slate-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-400 dark:text-slate-400" />
            )}
            <span className="text-gray-900 dark:text-white">Dark Mode</span>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-accent' : 'bg-gray-200 dark:bg-slate-600'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
      >
        <LogOut className="w-5 h-5 text-red-500" />
        <span className="text-red-500">Sign Out</span>
      </button>

      {/* App Version */}
      <p className="text-center text-gray-400 dark:text-slate-500 text-sm mt-8">
        DayGo Web v1.0.0
      </p>
    </div>
  )
}
