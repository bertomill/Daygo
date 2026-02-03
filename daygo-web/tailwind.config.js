/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
  			heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
  		},
  		colors: {
  			navy: '#0f172a',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			// Primary brand colors - calming indigo palette
  			brand: {
  				50: '#eef2ff',
  				100: '#e0e7ff',
  				200: '#c7d2fe',
  				300: '#a5b4fc',
  				400: '#818cf8',
  				500: '#6366f1',
  				600: '#4f46e5',
  				700: '#4338ca',
  				800: '#3730a3',
  				900: '#312e81',
  			},
  			teal: '#14b8a6',
  			success: '#10b981',
  			// Section-specific colors - harmonized
  			mantra: '#8b5cf6',
  			journal: '#f59e0b',
  			schedule: '#10b981',
  			identity: '#ec4899',
  			vision: '#3b82f6',
  			habit: '#10b981',
  			todo: '#6366f1',
  			// Refined bevel system
  			'bevel-bg': '#fafbfc',
  			'bevel-card': '#ffffff',
  			'bevel-text': '#1e293b',
  			'bevel-text-secondary': '#64748b',
  			'bevel-yellow': '#f59e0b',
  			'bevel-green': '#10b981',
  			'bevel-red': '#ef4444',
  			'bevel-blue': '#3b82f6',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		boxShadow: {
  			'bevel-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.06)',
  			bevel: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 12px 0 rgba(0, 0, 0, 0.06)',
  			'bevel-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 20px -2px rgba(0, 0, 0, 0.08)',
  			'bevel-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 20px 40px -4px rgba(0, 0, 0, 0.1)',
  			'card': '0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02), 0 8px 16px rgba(0, 0, 0, 0.04)',
  			'card-hover': '0 0 0 1px rgba(99, 102, 241, 0.1), 0 4px 8px rgba(0, 0, 0, 0.04), 0 12px 24px rgba(99, 102, 241, 0.08)'
  		},
  		keyframes: {
  			'slide-in-from-left': {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			'slide-in-from-right': {
  				'0%': {
  					transform: 'translateX(100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			'slide-out-to-left': {
  				'0%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				}
  			},
  			'slide-out-to-right': {
  				'0%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateX(100%)',
  					opacity: '0'
  				}
  			}
  		},
  		animation: {
  			'slide-in-left': 'slide-in-from-left 0.3s ease-out',
  			'slide-in-right': 'slide-in-from-right 0.3s ease-out',
  			'slide-out-left': 'slide-out-to-left 0.3s ease-in',
  			'slide-out-right': 'slide-out-to-right 0.3s ease-in'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/typography'),
      require("tailwindcss-animate")
],
}
