'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

export default function Home() {
  const router = useRouter()
  const { user, initialized } = useAuthStore()

  useEffect(() => {
    if (initialized) {
      if (user) {
        const home = user.email === 'bertmill19@gmail.com' ? '/crystalday' : '/today'
        router.replace(home)
      } else {
        router.replace('/login')
      }
    }
  }, [user, initialized, router])

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
