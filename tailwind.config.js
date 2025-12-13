/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // DayGo Brand Colors - Momentum Circles
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Brand green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        brand: {
          navy: '#0f172a',      // Deep navy (backgrounds)
          slate: '#1e293b',     // Lighter navy
          blue: '#3b82f6',      // Accent blue
          teal: '#14b8a6',      // Teal (progress)
          green: '#22c55e',     // Success green
        },
      },
    },
  },
  plugins: [],
};
