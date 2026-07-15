/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1', // Indigo
          dark: '#4F46E5',
          light: '#818CF8'
        },
        secondary: {
          DEFAULT: '#7C3AED', // Violet
          dark: '#6D28D9',
          light: '#A78BFA'
        },
        accent: {
          DEFAULT: '#06B6D4', // Cyan
          dark: '#0891B2',
          light: '#22D3EE'
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        // Background and card configurations matching requested palette
        appBg: {
          dark: '#0F172A',
          light: '#F8FAFC'
        },
        appCard: {
          dark: '#1E293B',
          light: '#FFFFFF'
        },
        appText: {
          dark: '#FFFFFF',
          light: '#0F172A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
