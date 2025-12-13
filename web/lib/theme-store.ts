import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  initialize: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',

  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem('daygo-theme', theme)

    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },

  initialize: () => {
    const stored = localStorage.getItem('daygo-theme') as Theme | null
    const theme = stored || 'light'

    set({ theme })

    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
}))
