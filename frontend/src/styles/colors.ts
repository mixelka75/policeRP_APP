// src/styles/colors.ts - Централизованная цветовая палитра
export const colorPalette = {
  // Основная цветовая схема (розово-фиолетовая)
  primary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9', // Розово-фиолетовый светлый
    500: '#d946ef', // Основной розово-фиолетовый
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },

  // Дополнительная схема (фиолетовая)
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#8b5cf6', // Фиолетовый
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },

  // Акцентная схема (розовая)
  accent: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899', // Розовый
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },

  // Финальная схема (глубокий фиолетовый)
  final: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Глубокий фиолетовый
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
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
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
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
  background: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #3a3a3a 50%, #4a4a4a 75%, #5a5a5a 100%)`,
  card: `linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(139, 92, 246, 0.1) 30%, rgba(236, 72, 153, 0.1) 70%, rgba(139, 92, 246, 0.1) 100%)`,
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