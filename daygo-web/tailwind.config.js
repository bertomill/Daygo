/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			navy: '#0f172a',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			teal: '#14b8a6',
  			success: '#22c55e',
  			mantra: '#9333ea',
  			journal: '#f97316',
  			schedule: '#10b981',
  			'bevel-bg': '#F8F9FA',
  			'bevel-card': '#FFFFFF',
  			'bevel-text': '#1a1a1a',
  			'bevel-text-secondary': '#6B7280',
  			'bevel-yellow': '#F5C518',
  			'bevel-green': '#4CAF50',
  			'bevel-red': '#EF5350',
  			'bevel-blue': '#42A5F5',
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
  			'bevel-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
  			bevel: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
  			'bevel-md': '0 4px 12px 0 rgba(0, 0, 0, 0.12)',
  			'bevel-lg': '0 8px 24px 0 rgba(0, 0, 0, 0.15)'
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
