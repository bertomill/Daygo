'use client'

import { useState } from 'react'
import { MessageSquare, Send, X, Loader2, Inbox, Camera, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'

export function FeedbackButton() {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false)

  const captureScreenshot = async () => {
    setIsCapturingScreenshot(true)
    try {
      // Temporarily hide the modal
      const modal = document.querySelector('[data-feedback-modal]') as HTMLElement
      if (modal) modal.style.display = 'none'

      // Small delay to ensure modal is hidden
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the page
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Reduce size for better performance
      })

      // Show modal again
      if (modal) modal.style.display = 'flex'

      // Convert to base64
      const screenshotData = canvas.toDataURL('image/jpeg', 0.7)
      setScreenshot(screenshotData)
    } catch (error) {
      console.error('Screenshot capture failed:', error)
    }
    setIsCapturingScreenshot(false)
  }

  const handleSend = async () => {
    if (!feedback.trim()) return

    setIsSending(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('feedback')
        .insert({
          user_email: user?.email || null,
          message: feedback.trim(),
          screenshot_url: screenshot,
        })

      if (!error) {
        setStatus('success')
        setFeedback('')
        setScreenshot(null)
        setTimeout(() => {
          setIsOpen(false)
          setStatus('idle')
        }, 2000)
      } else {
        console.error('Feedback error:', error)
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
    setIsSending(false)
  }

  const isAdmin = user?.email === 'bertmill19@gmail.com'

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {isAdmin && (
          <a
            href="/admin/feedback"
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Inbox className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Admin</span>
          </a>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <MessageSquare className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Feedback</span>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 p-4 z-50"
          data-feedback-modal
          onClick={() => {
            setIsOpen(false)
            setStatus('idle')
            setScreenshot(null)
          }}
        >
          <div
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-xl border border-white/20 dark:border-slate-700/50 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Feedback</h2>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setStatus('idle')
                  setScreenshot(null)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            {/* Personal message with photo */}
            <div className="flex items-start gap-3 mb-4 p-3 bg-accent/5 dark:bg-accent/10 rounded-xl">
              <img
                src="https://pbs.twimg.com/profile_images/1995251993531531264/uW58-PtD_400x400.jpg"
                alt="Berto"
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  <span className="font-medium text-gray-900 dark:text-white">Hey!</span> I&apos;m Berto, the creator of DayGo. I review all feedback and will try to address it within the next few days. Thanks for helping make DayGo better!
                </p>
              </div>
            </div>

            {status === 'success' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium mb-1">Thanks for your feedback!</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">I&apos;ll look into this soon.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-4"
                  rows={4}
                  autoFocus
                />

                {/* Screenshot Section */}
                <div className="mb-4">
                  {screenshot ? (
                    <div className="relative">
                      <img
                        src={screenshot}
                        alt="Screenshot"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                      />
                      <button
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                        Screenshot attached
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={captureScreenshot}
                      disabled={isCapturingScreenshot}
                      className="w-full py-2.5 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isCapturingScreenshot ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Capturing...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Attach Screenshot
                        </>
                      )}
                    </button>
                  )}
                </div>

                {status === 'error' && (
                  <p className="text-red-500 text-sm mb-4">Failed to send. Please try again.</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setStatus('idle')
                      setScreenshot(null)
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!feedback.trim() || isSending}
                    className="flex-1 py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
