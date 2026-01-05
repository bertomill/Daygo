/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DayGo brand colors from design philosophy
        navy: '#0f172a',
        accent: '#3b82f6',
        teal: '#14b8a6',
        success: '#22c55e',
        mantra: '#9333ea',
        journal: '#f97316',
        schedule: '#10b981',
        // Bevel-inspired colors
        'bevel-bg': '#F8F9FA',
        'bevel-card': '#FFFFFF',
        'bevel-text': '#1a1a1a',
        'bevel-text-secondary': '#6B7280',
        'bevel-yellow': '#F5C518',
        'bevel-green': '#4CAF50',
        'bevel-red': '#EF5350',
        'bevel-blue': '#42A5F5',
      },
      boxShadow: {
        'bevel-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'bevel': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        'bevel-md': '0 4px 12px 0 rgba(0, 0, 0, 0.12)',
        'bevel-lg': '0 8px 24px 0 rgba(0, 0, 0, 0.15)',
      },
      keyframes: {
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-to-left': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        'slide-out-to-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-right': 'slide-in-from-right 0.3s ease-out',
        'slide-out-left': 'slide-out-to-left 0.3s ease-in',
        'slide-out-right': 'slide-out-to-right 0.3s ease-in',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
