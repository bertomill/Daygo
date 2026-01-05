import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  userId: string | null
  setTheme: (theme: Theme) => void
  initializeForUser: (userId: string | null) => void
}

const applyTheme = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const getStorageKey = (userId: string | null) => {
  return userId ? `daygo-theme-${userId}` : null
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  userId: null,

  setTheme: (theme) => {
    const { userId } = get()
    set({ theme })

    const key = getStorageKey(userId)
    if (key) {
      localStorage.setItem(key, theme)
    }

    applyTheme(theme)
  },

  initializeForUser: (userId) => {
    // Always reset to light when no user
    if (!userId) {
      set({ theme: 'light', userId: null })
      applyTheme('light')
      return
    }

    const key = getStorageKey(userId)
    const stored = key ? (localStorage.getItem(key) as Theme | null) : null
    const theme = stored || 'light'

    set({ theme, userId })
    applyTheme(theme)
  },
}))
