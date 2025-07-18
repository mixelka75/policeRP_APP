// src/styles/colors.ts - Централизованная цветовая палитра
export const colorPalette = {
  // Основная цветовая схема (приглушенная желто-розово-фиолетовая)
  primary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#f0d142', // Приглушенный желтый
    500: '#d4a574', // Основной желтый
    600: '#c2956a',
    700: '#a67c5a',
    800: '#8a6548',
    900: '#6b4f38',
    950: '#3d2a1f',
  },

  // Дополнительная схема (розово-оранжевая)
  secondary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#d4848a', // Приглушенный розово-оранжевый
    600: '#c46d74',
    700: '#a85961',
    800: '#8b4a52',
    900: '#6b3840',
    950: '#3d1f23',
  },

  // Акцентная схема (розово-фиолетовая)
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#b67bb8', // Приглушенный розово-фиолетовый
    600: '#a366a8',
    700: '#8d5494',
    800: '#74457a',
    900: '#5c3861',
    950: '#3a1f3d',
  },

  // Финальная схема (фиолетовая)
  final: {
    50: '#f8f6ff',
    100: '#f1ecff',
    200: '#e5dcff',
    300: '#d1bfff',
    400: '#b599ff',
    500: '#9381b3', // Приглушенный фиолетовый
    600: '#8671a3',
    700: '#75608f',
    800: '#615077',
    900: '#4d4061',
    950: '#2e2638',
  },

  // Темная схема (без изменений)
  dark: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#0a0a0f',
  },

  // Статусные цвета (слегка приглушенные)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#f59e0b',
    500: '#d97706',
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  },

  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  info: {
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
  },
};

// Градиенты для использования в CSS
export const gradients = {
  primary: `linear-gradient(135deg, ${colorPalette.primary[400]} 0%, ${colorPalette.secondary[500]} 30%, ${colorPalette.accent[500]} 70%, ${colorPalette.final[500]} 100%)`,
  primaryReverse: `linear-gradient(135deg, ${colorPalette.final[500]} 0%, ${colorPalette.accent[500]} 30%, ${colorPalette.secondary[500]} 70%, ${colorPalette.primary[400]} 100%)`,
  background: `linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 25%, #3a2650 50%, #4a2c5a 75%, #5a3468 100%)`,
  card: `linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(212, 132, 138, 0.1) 30%, rgba(182, 123, 184, 0.1) 70%, rgba(147, 129, 179, 0.1) 100%)`,
  button: `linear-gradient(135deg, ${colorPalette.primary[500]} 0%, ${colorPalette.secondary[500]} 50%, ${colorPalette.accent[500]} 100%)`,
  text: `linear-gradient(135deg, ${colorPalette.primary[400]} 0%, ${colorPalette.secondary[400]} 30%, ${colorPalette.accent[400]} 70%, ${colorPalette.final[400]} 100%)`,
};

// CSS переменные для динамического использования
export const cssVariables = {
  '--color-primary': colorPalette.primary[500],
  '--color-primary-light': colorPalette.primary[400],
  '--color-primary-dark': colorPalette.primary[600],
  '--color-secondary': colorPalette.secondary[500],
  '--color-secondary-light': colorPalette.secondary[400],
  '--color-secondary-dark': colorPalette.secondary[600],
  '--color-accent': colorPalette.accent[500],
  '--color-accent-light': colorPalette.accent[400],
  '--color-accent-dark': colorPalette.accent[600],
  '--color-final': colorPalette.final[500],
  '--color-final-light': colorPalette.final[400],
  '--color-final-dark': colorPalette.final[600],
  '--gradient-primary': gradients.primary,
  '--gradient-background': gradients.background,
  '--gradient-card': gradients.card,
  '--gradient-button': gradients.button,
  '--gradient-text': gradients.text,
};

// Функция для применения CSS переменных
export const applyCSSVariables = () => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
};

// Tailwind цвета для экспорта
export const tailwindColors = {
  primary: colorPalette.primary,
  secondary: colorPalette.secondary,
  accent: colorPalette.accent,
  final: colorPalette.final,
  dark: colorPalette.dark,
  success: colorPalette.success,
  warning: colorPalette.warning,
  danger: colorPalette.danger,
  info: colorPalette.info,
};

export default colorPalette;