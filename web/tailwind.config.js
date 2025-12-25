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
      },
    },
  },
  plugins: [],
}
