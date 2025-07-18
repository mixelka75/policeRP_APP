/** @type {import('tailwindcss').Config} */
import { tailwindColors, gradients } from './src/styles/colors.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...tailwindColors,
        // Оставляем minecraft цвета без изменений для совместимости
        minecraft: {
          grass: '#7CB342',
          dirt: '#8D6E63',
          stone: '#616161',
          diamond: '#00BCD4',
          emerald: '#4CAF50',
          gold: '#FFD700',
          redstone: '#F44336',
          lapis: '#2196F3',
          obsidian: '#1A1A2E',
          nether: '#8B1A1A',
          end: '#4A148C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        minecraft: ['Minecraft', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'particle-float': 'particle-float 10s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
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
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(212, 165, 116, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(212, 165, 116, 0.6)' },
        },
        'particle-float': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(360deg)', opacity: '0' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'minecraft-gradient': gradients.primary,
        'minecraft-dark': gradients.background,
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'primary-gradient': gradients.primary,
        'card-gradient': gradients.card,
        'button-gradient': gradients.button,
        'text-gradient': gradients.text,
      },
      boxShadow: {
        'minecraft': '0 8px 32px rgba(212, 165, 116, 0.3)',
        'minecraft-hover': '0 12px 48px rgba(212, 165, 116, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 30px rgba(212, 165, 116, 0.6)',
        'neon': '0 0 5px theme(colors.primary.500), 0 0 20px theme(colors.primary.500), 0 0 40px theme(colors.primary.500)',
        'primary-glow': '0 0 30px rgba(212, 165, 116, 0.4)',
        'secondary-glow': '0 0 30px rgba(212, 132, 138, 0.4)',
        'accent-glow': '0 0 30px rgba(182, 123, 184, 0.4)',
      },
      blur: {
        'xs': '2px',
        'minecraft': '10px',
      },
      borderWidth: {
        '3': '3px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}