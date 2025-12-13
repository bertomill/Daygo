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
  const initializeTheme = useThemeStore((state) => state.initialize)

  useEffect(() => {
    initializeAuth()
    initializeTheme()
  }, [initializeAuth, initializeTheme])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
