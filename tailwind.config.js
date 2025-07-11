/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        pret: {
          red: '#e11d2f',
          dark: '#b71c2c',
        },
        status: {
          online: '#10b981',
          offline: '#6b7280',
          warning: '#f59e0b', 
          critical: '#ef4444',
        },
        dark: {
          950: '#0a0f1c',
          900: '#0f172a',
          850: '#1a2332',
          800: '#1e293b',
          750: '#283548',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        }
      }
    },
  },
  plugins: [],
};