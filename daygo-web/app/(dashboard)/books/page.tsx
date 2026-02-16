'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { booksService } from '@/lib/services/books'
import type { Book } from '@/lib/types/database'
import { BookOpen, TrendingUp, Calendar } from 'lucide-react'

const CURRENT_YEAR = 2026
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function BooksPage() {
  const { user } = useAuthStore()
  const [booksByYear, setBooksByYear] = useState<Record<number, Book[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    booksService.getCompletedBooksByYear(user.id).then((data) => {
      setBooksByYear(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const years = useMemo(() => {
    const allYears = Object.keys(booksByYear).map(Number)
    if (!allYears.includes(CURRENT_YEAR)) allYears.push(CURRENT_YEAR)
    return allYears.sort((a, b) => b - a)
  }, [booksByYear])

  const getMonthlyBreakdown = (year: number) => {
    const books = booksByYear[year] || []
    const monthly = Array(12).fill(0)
    for (const book of books) {
      if (book.completed_at) {
        const month = new Date(book.completed_at).getMonth()
        monthly[month]++
      }
    }
    return monthly
  }

  const currentYearBooks = booksByYear[CURRENT_YEAR] || []
  const currentMonthly = getMonthlyBreakdown(CURRENT_YEAR)
  const maxMonthly = Math.max(...currentMonthly, 1)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-bevel-text-secondary">Loading books...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bevel-text dark:text-white flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-accent" />
          Books Read
        </h1>
        <p className="text-bevel-text-secondary dark:text-slate-400 mt-1">
          Track your reading journey year over year
        </p>
      </div>

      {/* Year Total Hero Card */}
      <div className="bg-gradient-to-br from-accent/10 via-brand-100/30 to-brand-200/20 dark:from-accent/20 dark:via-brand-900/30 dark:to-slate-800 rounded-2xl p-6 border border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-bevel-text-secondary dark:text-slate-400 uppercase tracking-wide">{CURRENT_YEAR} Total</p>
            <p className="text-5xl font-bold text-accent mt-1">{currentYearBooks.length}</p>
            <p className="text-bevel-text-secondary dark:text-slate-400 mt-1">
              {currentYearBooks.length === 1 ? 'book' : 'books'} completed
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-accent" />
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart for Current Year */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-700/50">
        <h2 className="text-lg font-semibold text-bevel-text dark:text-white mb-1 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          {CURRENT_YEAR} Month by Month
        </h2>
        <p className="text-sm text-bevel-text-secondary dark:text-slate-400 mb-6">Books completed each month</p>

        <div className="flex items-end gap-2 h-48">
          {currentMonthly.map((count, i) => {
            const heightPercent = (count / maxMonthly) * 100
            const isCurrentMonth = i === new Date().getMonth()
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-bevel-text dark:text-white">
                  {count > 0 ? count : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '160px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isCurrentMonth
                        ? 'bg-accent'
                        : count > 0
                          ? 'bg-brand-400 dark:bg-brand-500'
                          : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                    style={{ height: count > 0 ? `${Math.max(heightPercent, 8)}%` : '4px' }}
                  />
                </div>
                <span className={`text-xs ${isCurrentMonth ? 'font-bold text-accent' : 'text-bevel-text-secondary dark:text-slate-400'}`}>
                  {MONTHS[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Books List for Current Year */}
      {currentYearBooks.length > 0 && (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-bevel-text dark:text-white mb-4">
            Books Completed in {CURRENT_YEAR}
          </h2>
          <div className="space-y-3">
            {currentYearBooks.map((book) => (
              <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-bevel-text dark:text-white truncate">{book.title}</p>
                  {book.author && (
                    <p className="text-sm text-bevel-text-secondary dark:text-slate-400 truncate">{book.author}</p>
                  )}
                </div>
                {book.completed_at && (
                  <span className="text-xs text-bevel-text-secondary dark:text-slate-400 flex-shrink-0">
                    {new Date(book.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year-over-Year Comparison */}
      {years.length > 1 && (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-bevel-text dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Year over Year
          </h2>
          <div className="space-y-3">
            {years.map((year) => {
              const count = (booksByYear[year] || []).length
              const maxYear = Math.max(...years.map(y => (booksByYear[y] || []).length), 1)
              const widthPercent = (count / maxYear) * 100
              return (
                <div key={year} className="flex items-center gap-4">
                  <span className={`text-sm font-semibold w-12 ${year === CURRENT_YEAR ? 'text-accent' : 'text-bevel-text dark:text-white'}`}>
                    {year}
                  </span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center px-3 transition-all ${
                        year === CURRENT_YEAR ? 'bg-accent' : 'bg-brand-400 dark:bg-brand-500'
                      }`}
                      style={{ width: count > 0 ? `${Math.max(widthPercent, 10)}%` : '0%' }}
                    >
                      {count > 0 && (
                        <span className="text-xs font-bold text-white">{count} {count === 1 ? 'book' : 'books'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
