'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'
import { Check, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface FeedbackItem {
  id: string
  user_email: string | null
  message: string
  resolved: boolean
  created_at: string
}

const ADMIN_EMAIL = 'bertmill19@gmail.com'

export default function AdminFeedbackPage() {
  const router = useRouter()
  const { user, initialized } = useAuthStore()
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (initialized && user?.email !== ADMIN_EMAIL) {
      router.replace('/today')
    }
  }, [user, initialized, router])

  // Fetch feedback
  useEffect(() => {
    async function fetchFeedback() {
      if (!user || user.email !== ADMIN_EMAIL) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setFeedback(data)
      }
      setLoading(false)
    }

    if (initialized && user?.email === ADMIN_EMAIL) {
      fetchFeedback()
    }
  }, [user, initialized])

  const toggleResolved = async (id: string, currentResolved: boolean) => {
    setUpdating(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('feedback')
      .update({ resolved: !currentResolved })
      .eq('id', id)

    if (!error) {
      setFeedback(prev =>
        prev.map(item =>
          item.id === id ? { ...item, resolved: !currentResolved } : item
        )
      )
    }
    setUpdating(null)
  }

  if (!initialized || user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/today"
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback</h1>
        <span className="text-sm text-gray-500 dark:text-slate-400">
          {feedback.length} total
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : feedback.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
          No feedback yet
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-colors ${
                item.resolved
                  ? 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleResolved(item.id, item.resolved)}
                  disabled={updating === item.id}
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    item.resolved
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-slate-600 hover:border-accent'
                  }`}
                >
                  {updating === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : item.resolved ? (
                    <Check className="w-4 h-4" />
                  ) : null}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.user_email || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm whitespace-pre-wrap ${
                      item.resolved
                        ? 'text-gray-400 dark:text-slate-500 line-through'
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
