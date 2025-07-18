/** @type {import('tailwindcss').Config} */
import { tailwindColors } from './src/styles/colors.ts';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Новая цветовая схема из централизованного файла
        ...tailwindColors,

        // Специальные цвета для Minecraft темы
        minecraft: {
          dark: '#0a0a0f',
          light: '#f3f4f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(212, 165, 116, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(212, 165, 116, 0.6)' },
        },
      },
      boxShadow: {
        'primary-glow': '0 0 20px rgba(212, 165, 116, 0.4)',
        'secondary-glow': '0 0 20px rgba(212, 132, 138, 0.4)',
        'accent-glow': '0 0 20px rgba(182, 123, 184, 0.4)',
        'final-glow': '0 0 20px rgba(147, 129, 179, 0.4)',
        'minecraft': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'minecraft-hover': '0 8px 24px rgba(212, 165, 116, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'primary-gradient': 'linear-gradient(135deg, #f0d142 0%, #d4848a 30%, #b67bb8 70%, #9381b3 100%)',
        'minecraft-gradient': 'linear-gradient(135deg, #d4a574 0%, #d4848a 50%, #b67bb8 100%)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}