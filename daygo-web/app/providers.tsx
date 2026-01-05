'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { useThemeStore } from '@/lib/theme-store'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const initializeAuth = useAuthStore((state) => state.initialize)
  const user = useAuthStore((state) => state.user)
  const initialized = useAuthStore((state) => state.initialized)
  const initializeThemeForUser = useThemeStore((state) => state.initializeForUser)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Initialize theme when user changes (login/logout)
  useEffect(() => {
    if (initialized) {
      initializeThemeForUser(user?.id ?? null)
    }
  }, [user?.id, initialized, initializeThemeForUser])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
