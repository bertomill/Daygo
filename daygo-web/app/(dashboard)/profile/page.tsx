'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, Shield, LogOut, Moon, Sun, Crown, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useThemeStore } from '@/lib/theme-store'
import { supabase } from '@/lib/supabase'
import AvatarUpload from '@/components/AvatarUpload'

type SubscriptionTier = 'free' | 'pro'
type SubscriptionStatus = 'inactive' | 'active' | 'canceled' | 'past_due'

interface ProfileData {
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  subscription_current_period_end: string | null
  stripe_customer_id: string | null
  avatar_url: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Check for success/canceled query params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Successfully upgraded to Pro!' })
      // Refresh profile data
      fetchProfile()
    } else if (searchParams.get('canceled') === 'true') {
      setMessage({ type: 'error', text: 'Upgrade canceled.' })
    }
  }, [searchParams])

  // Fetch profile data
  const fetchProfile = async () => {
    if (!user?.id) return

    setIsLoadingProfile(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_current_period_end, stripe_customer_id, avatar_url')
      .eq('id', user.id)
      .single()

    if (data && !error) {
      setProfile(data as ProfileData)
    }
    setIsLoadingProfile(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [user?.id])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleUpgrade = async () => {
    if (!user?.id || !user?.email) return

    setIsUpgrading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: 'Failed to start checkout.' })
        setIsUpgrading(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start checkout.' })
      setIsUpgrading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!profile?.stripe_customer_id) return

    setIsManaging(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profile.stripe_customer_id }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: 'Failed to open subscription management.' })
        setIsManaging(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open subscription management.' })
      setIsManaging(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.id || deleteConfirmText !== 'DELETE') return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.success) {
        // Sign out and redirect to login
        await signOut()
        router.push('/login?deleted=true')
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' })
        setIsDeleting(false)
        setShowDeleteConfirm(false)
        setDeleteConfirmText('')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' })
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const isPro = profile?.subscription_tier === 'pro' && profile?.subscription_status === 'active'
  const isCanceled = profile?.subscription_status === 'canceled' && profile?.subscription_current_period_end && new Date(profile.subscription_current_period_end) > new Date()

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen bg-bevel-bg dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-bevel-text dark:text-white mb-6">Profile</h1>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* User Info */}
      <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-bevel">
        <div className="flex flex-col items-center gap-4">
          <AvatarUpload
            userId={user?.id || ''}
            currentAvatarUrl={profile?.avatar_url}
            onUploadComplete={() => fetchProfile()}
          />
          <div className="text-center">
            <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {isPro || isCanceled ? 'DayGo Pro Member' : 'DayGo Member'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 mb-6 shadow-bevel">
        <div className="flex items-center gap-3 mb-4">
          <Crown className={`w-5 h-5 ${isPro ? 'text-yellow-500' : 'text-gray-400 dark:text-slate-400'}`} />
          <span className="text-gray-900 dark:text-white font-medium">Subscription</span>
        </div>

        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : isPro || isCanceled ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium px-3 py-1 rounded-full">
                Pro
              </span>
              {isCanceled ? (
                <span className="text-orange-600 dark:text-orange-400 text-sm">Canceled</span>
              ) : (
                <span className="text-green-600 dark:text-green-400 text-sm">Active</span>
              )}
            </div>
            {profile?.subscription_current_period_end && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                {isCanceled ? 'Access until' : 'Renews on'} {new Date(profile.subscription_current_period_end).toLocaleDateString()}
              </p>
            )}
            <button
              onClick={handleManageSubscription}
              disabled={isManaging}
              className="w-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isManaging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Manage Subscription'
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium px-3 py-1 rounded-full">
                Free
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Upgrade to Pro for unlimited features and priority support.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro - $20/month
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 shadow-bevel">
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
      <div className="bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 mb-6 shadow-bevel">
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

      {/* Delete Account */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:shadow-bevel-md transition-all shadow-bevel mb-6"
      >
        <Trash2 className="w-5 h-5 text-red-500" />
        <span className="text-red-500">Delete Account</span>
      </button>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-bevel-card dark:bg-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:shadow-bevel-md transition-all shadow-bevel"
      >
        <LogOut className="w-5 h-5 text-red-500" />
        <span className="text-red-500">Sign Out</span>
      </button>

      {/* App Version */}
      <p className="text-center text-gray-400 dark:text-slate-500 text-sm mt-8">
        DayGo Web v1.0.0
      </p>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteConfirm(false)
              setDeleteConfirmText('')
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account</h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-slate-300 mb-4">
                This action is permanent and cannot be undone. All your data including:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-slate-300 space-y-1 mb-4">
                <li>Habits and tracking history</li>
                <li>Goals and progress</li>
                <li>Journal entries and notes</li>
                <li>Mantras and schedules</li>
                <li>All personal data</li>
              </ul>
              <p className="text-gray-600 dark:text-slate-300 mb-4">
                will be permanently deleted.
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> If you have an active subscription, it will be canceled. You may be entitled to a refund based on Stripe's refund policy.
                </p>
              </div>

              <p className="text-gray-900 dark:text-white font-medium mb-2">
                Type <span className="font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
