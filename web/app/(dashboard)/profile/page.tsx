'use client'

import { useRouter } from 'next/navigation'
import { User, HelpCircle, Shield, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      {/* User Info */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-accent" />
          </div>
          <div>
            <p className="text-white font-medium">{user?.email}</p>
            <p className="text-sm text-slate-400">DayGo Member</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-slate-800 rounded-xl overflow-hidden mb-6">
        <a
          href="mailto:support@daygo.app"
          className="flex items-center gap-4 p-4 hover:bg-slate-700 transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-slate-400" />
          <span className="text-white">Help & Support</span>
        </a>
        <div className="border-t border-slate-700" />
        <a
          href="/privacy"
          target="_blank"
          className="flex items-center gap-4 p-4 hover:bg-slate-700 transition-colors"
        >
          <Shield className="w-5 h-5 text-slate-400" />
          <span className="text-white">Privacy Policy</span>
        </a>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-slate-800 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-700 transition-colors"
      >
        <LogOut className="w-5 h-5 text-red-400" />
        <span className="text-red-400">Sign Out</span>
      </button>

      {/* App Version */}
      <p className="text-center text-slate-500 text-sm mt-8">
        DayGo Web v1.0.0
      </p>
    </div>
  )
}
