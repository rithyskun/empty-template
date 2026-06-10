/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './base/**/*.{vue,js,ts,jsx,tsx}',
    './features/**/*.{vue,js,ts,jsx,tsx}',
    './modules/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Poppins',
          'Noto Sans Khmer',
          'Leelawadee UI',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          dark: '#1e40af',
        },
        dark: {
          bg: '#0f172a',
          'bg-secondary': '#1e293b',
          text: '#f8fafc',
          'text-secondary': '#94a3b8',
        },
      },
      backgroundColor: {
        dark: '#0f172a',
        'dark-secondary': '#1e293b',
      },
      textColor: {
        dark: '#f8fafc',
        'dark-secondary': '#94a3b8',
      },
      borderColor: {
        dark: '#334155',
      },
    },
  },
  plugins: [],
};
