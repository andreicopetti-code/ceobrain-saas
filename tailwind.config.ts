import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design system CEO Brain — baseado no app existente
        brand: {
          DEFAULT: '#6366f1',   // indigo-500 — cor primária
          hover:   '#4f46e5',   // indigo-600
          light:   '#e0e7ff',   // indigo-100
          dark:    '#3730a3',   // indigo-800
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger:  '#ef4444',
        // Superfícies
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
          dark: '#111827',
          'dark-secondary': '#1f2937',
        },
        // Bordas
        border: {
          DEFAULT: '#e5e7eb',
          dark: '#374151',
        },
        // Texto
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          muted: '#9ca3af',
          'dark-primary': '#f9fafb',
          'dark-secondary': '#d1d5db',
        },
        // Kanban stages
        stage: {
          prospect:    '#6366f1',  // Prospecção
          negotiation: '#f59e0b',  // Negociação
          proposal:    '#3b82f6',  // Proposta
          closing:     '#8b5cf6',  // Fechamento
          won:         '#22c55e',  // Ganho
          lost:        '#ef4444',  // Perdido
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        modal: '0 20px 60px -10px rgb(0 0 0 / 0.3)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                 to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
