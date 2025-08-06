// src/utils/index.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { User } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ ИСПРАВЛЕНО: Улучшенная обработка дат
export function formatDate(date: string | Date | null | undefined, formatString: string = 'dd.MM.yyyy HH:mm') {
  try {
    if (!date) {
      return 'Дата не указана';
    }

    let dateObj: Date;

    if (typeof date === 'string') {
      // Попытка парсинга ISO строки
      dateObj = parseISO(date);

      // Если parseISO не сработал, пробуем обычный Date
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Проверяем, что дата корректная
    if (!isValid(dateObj)) {
      console.warn('Invalid date provided:', date);
      return 'Неверная дата';
    }

    return format(dateObj, formatString, { locale: ru });
  } catch (error) {
    console.error('Date formatting error:', error, 'Date:', date);
    return 'Ошибка даты';
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная обработка относительного времени
export function formatRelativeTime(date: string | Date | null | undefined) {
  try {
    if (!date) {
      return 'Дата не указана';
    }

    let dateObj: Date;

    if (typeof date === 'string') {
      dateObj = parseISO(date);
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) {
      console.warn('Invalid date provided for relative time:', date);
      return 'Неверная дата';
    }

    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: ru
    });
  } catch (error) {
    console.error('Relative time formatting error:', error, 'Date:', date);
    return 'Ошибка даты';
  }
}

export function formatMoney(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0 АР';
    }

    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' АР';
  } catch (error) {
    console.error('Money formatting error:', error);
    return `${amount} АР`;
  }
}

export function capitalizeFirst(str: string) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ✅ ИСПРАВЛЕНО: Улучшенная генерация инициалов
export function getInitials(firstName: string, lastName?: string) {
  try {
    if (!firstName || typeof firstName !== 'string') {
      return '??';
    }

    const first = firstName.trim().charAt(0);
    const last = lastName && typeof lastName === 'string' ? lastName.trim().charAt(0) : '';

    if (first && last) {
      return `${first}${last}`.toUpperCase();
    }

    if (first && firstName.length > 1) {
      return `${first}${firstName.charAt(1)}`.toUpperCase();
    }

    return first.toUpperCase() || '??';
  } catch (error) {
    console.error('Initials generation error:', error);
    return '??';
  }
}

// ✅ ИСПРАВЛЕНО: Правильная генерация Discord аватара согласно API
export function getDiscordAvatarUrl(user: User | null | undefined, size: number = 128): string {
  try {
    if (!user || !user.discord_id) {
      console.warn('getDiscordAvatarUrl: Invalid user or missing discord_id', user);
      return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }

    // Валидируем размер (должен быть степенью 2 от 16 до 4096)
    const validSizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
    const validSize = validSizes.includes(size) ? size : 128;

    console.log('getDiscordAvatarUrl: Processing user:', {
      discord_id: user.discord_id,
      discord_username: user.discord_username,
      discord_avatar: user.discord_avatar,
      discord_discriminator: user.discord_discriminator,
      size: validSize
    });

    if (!user.discord_avatar || user.discord_avatar === null || user.discord_avatar === 'undefined' || user.discord_avatar === '') {
      // Fallback к дефолтному аватару Discord
      // Определяем, какую формулу использовать для дефолтного аватара
      let defaultAvatarId: number;
      
      if (user.discord_discriminator && user.discord_discriminator !== '0' && user.discord_discriminator !== 'undefined' && user.discord_discriminator !== null) {
        // Старая система с дискриминатором
        defaultAvatarId = parseInt(user.discord_discriminator) % 5;
        console.log('getDiscordAvatarUrl: Using legacy discriminator system, defaultAvatarId:', defaultAvatarId);
      } else {
        // Новая система имён пользователей
        try {
          const userId = BigInt(user.discord_id);
          defaultAvatarId = Number((userId >> 22n) % 6n);
          console.log('getDiscordAvatarUrl: Using new username system, defaultAvatarId:', defaultAvatarId);
        } catch (error) {
          console.error('getDiscordAvatarUrl: Error calculating default avatar with BigInt:', error);
          // Fallback к простому модулю
          defaultAvatarId = parseInt(user.discord_id.slice(-1)) % 6;
        }
      }
      
      const defaultUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarId}.png`;
      console.log('getDiscordAvatarUrl: Using default avatar:', defaultUrl);
      return defaultUrl;
    }

    // Проверяем, анимированный ли аватар (начинается с 'a_')
    const isAnimated = user.discord_avatar.startsWith('a_');
    const extension = isAnimated ? 'gif' : 'png';

    const customUrl = `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.${extension}?size=${validSize}`;
    console.log('getDiscordAvatarUrl: Using custom avatar:', customUrl, 'isAnimated:', isAnimated);
    return customUrl;
  } catch (error) {
    console.error('Discord avatar URL generation error:', error, 'User:', user);
    return `https://cdn.discordapp.com/embed/avatars/0.png`;
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная генерация Minecraft скина
export function getMinecraftSkinUrl(username: string | null | undefined, size: number = 128): string {
  try {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return `https://mc-heads.net/avatar/steve/${size}`;
    }

    const cleanUsername = username.trim();
    return `https://mc-heads.net/avatar/${encodeURIComponent(cleanUsername)}/${size}`;
  } catch (error) {
    console.error('Minecraft skin URL generation error:', error);
    return `https://mc-heads.net/avatar/steve/${size}`;
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная генерация полного имени пользователя
export function getFullUserName(user: User | null | undefined): string {
  try {
    if (!user || !user.discord_username) {
      return 'Unknown User';
    }

    // Проверяем, есть ли дискриминатор и он не равен '0'
    if (user.discord_discriminator && user.discord_discriminator !== '0' && user.discord_discriminator !== 'undefined') {
      // Старый формат Discord с дискриминатором
      return `${user.discord_username}#${user.discord_discriminator}`;
    } else {
      // Новый формат Discord без дискриминатора
      return `@${user.discord_username}`;
    }
  } catch (error) {
    console.error('Full user name generation error:', error);
    return 'Unknown User';
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная генерация отображаемого имени
export function getDisplayName(user: User | null | undefined): string {
  try {
    if (!user) {
      return 'Unknown User';
    }

    // Если есть Minecraft username, используем его
    if (user.minecraft_username && user.minecraft_username.trim() !== '') {
      return user.minecraft_username;
    }

    // Иначе используем Discord username
    if (user.discord_username && user.discord_username.trim() !== '') {
      return user.discord_username;
    }

    return 'Unknown User';
  } catch (error) {
    console.error('Display name generation error:', error);
    return 'Unknown User';
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная проверка устаревших данных
export function isUserDataOutdated(user: User | null | undefined, maxAgeMinutes: number = 30): boolean {
  try {
    if (!user || !user.last_role_check) {
      return true;
    }

    const lastCheck = parseISO(user.last_role_check);
    if (!isValid(lastCheck)) {
      return true;
    }

    const now = new Date();
    const diffMinutes = (now.getTime() - lastCheck.getTime()) / (1000 * 60);

    return diffMinutes > maxAgeMinutes;
  } catch (error) {
    console.error('User data outdated check error:', error);
    return true;
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная генерация названия роли
export function getRoleDisplayName(role: string | null | undefined): string {
  if (!role || typeof role !== 'string') {
    return 'Неизвестная роль';
  }

  switch (role.toLowerCase()) {
    case 'admin':
      return 'Администратор';
    case 'police':
      return 'Полицейский';
    case 'citizen':
      return 'Житель';
    default:
      return role;
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная генерация цвета роли
export function getRoleColor(role: string | null | undefined): string {
  if (!role || typeof role !== 'string') {
    return 'text-gray-400';
  }

  switch (role.toLowerCase()) {
    case 'admin':
      return 'text-red-400';
    case 'police':
      return 'text-blue-400';
    case 'citizen':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

// ✅ ИСПРАВЛЕНО: Улучшенная генерация цвета фона роли
export function getRoleBackgroundColor(role: string | null | undefined): string {
  if (!role || typeof role !== 'string') {
    return 'bg-gray-500/20';
  }

  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-red-500/20';
    case 'police':
      return 'bg-blue-500/20';
    case 'citizen':
      return 'bg-green-500/20';
    default:
      return 'bg-gray-500/20';
  }
}

// ✅ СУЩЕСТВУЮЩИЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ
export function validateForm(data: Record<string, any>, rules: Record<string, any>) {
  const errors: Record<string, string> = {};

  try {
    Object.keys(rules).forEach(field => {
      const value = data[field];
      const rule = rules[field];

      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = `${rule.label} обязательно для заполнения`;
      } else if (value && rule.minLength && value.length < rule.minLength) {
        errors[field] = `${rule.label} должно содержать минимум ${rule.minLength} символов`;
      } else if (value && rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `${rule.label} должно содержать максимум ${rule.maxLength} символов`;
      } else if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.patternMessage || `${rule.label} имеет неверный формат`;
      } else if (value && rule.min && parseFloat(value) < rule.min) {
        errors[field] = `${rule.label} должно быть не менее ${rule.min}`;
      } else if (value && rule.max && parseFloat(value) > rule.max) {
        errors[field] = `${rule.label} должно быть не более ${rule.max}`;
      }
    });
  } catch (error) {
    console.error('Form validation error:', error);
  }

  return errors;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function getErrorMessage(error: unknown): string {
  try {
    if (error && typeof error === 'object') {
      // Handle Pydantic validation errors (array format)
      if ('detail' in error) {
        const detail = (error as any).detail;
        if (Array.isArray(detail)) {
          return detail
            .map(err => typeof err === 'object' ? err.msg || 'Ошибка валидации' : String(err))
            .join(', ');
        } else if (typeof detail === 'string') {
          return detail;
        }
      }

      if ('response' in error && error.response && typeof error.response === 'object') {
        const response = error.response as any;
        if (response.data?.detail) {
          return response.data.detail;
        }
        if (response.data?.message) {
          return response.data.message;
        }
      }

      if ('message' in error && typeof (error as any).message === 'string') {
        return (error as any).message;
      }
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Произошла неизвестная ошибка';
  } catch (e) {
    console.error('Error in getErrorMessage:', e);
    return 'Произошла неизвестная ошибка';
  }
}

// Safe string conversion for React components to prevent error #31
export function safeStringify(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object object]';
    }
  }
  
  return String(value);
}

export function parseJwt(token: string) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT parsing error:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') {
      return true;
    }

    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token expiration check error:', error);
    return true;
  }
}

// ✅ Утилита для проверки доступности Discord CDN
export function testDiscordCDN(): Promise<boolean> {
  return new Promise((resolve) => {
    const testImage = new Image();
    const testUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    const timeout = setTimeout(() => {
      console.warn('Discord CDN test timeout');
      resolve(false);
    }, 5000);

    testImage.onload = () => {
      clearTimeout(timeout);
      console.log('Discord CDN is accessible');
      resolve(true);
    };

    testImage.onerror = () => {
      clearTimeout(timeout);
      console.error('Discord CDN is not accessible');
      resolve(false);
    };

    testImage.src = testUrl;
  });
}

// Export avatar cache utilities
export { default as AvatarCache } from './avatarCache';