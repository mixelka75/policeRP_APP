// src/utils/index.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatString: string = 'dd.MM.yyyy HH:mm') {
  try {
    return format(new Date(date), formatString, { locale: ru });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Неверная дата';
  }
}

export function formatRelativeTime(date: string | Date) {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ru
    });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Неверная дата';
  }
}

export function formatMoney(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0 ₽';
    }

    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    console.error('Money formatting error:', error);
    return `${amount} ₽`;
  }
}

export function capitalizeFirst(str: string) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(firstName: string, lastName: string) {
  try {
    const first = firstName && typeof firstName === 'string' ? firstName.charAt(0) : '';
    const last = lastName && typeof lastName === 'string' ? lastName.charAt(0) : '';
    return `${first}${last}`.toUpperCase() || '??';
  } catch (error) {
    console.error('Initials generation error:', error);
    return '??';
  }
}

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
  let timeout: NodeJS.Timeout;
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
      // API Error с detail
      if ('detail' in error && typeof (error as any).detail === 'string') {
        return (error as any).detail;
      }

      // Axios error response
      if ('response' in error && error.response && typeof error.response === 'object') {
        const response = error.response as any;
        if (response.data?.detail) {
          return response.data.detail;
        }
        if (response.data?.message) {
          return response.data.message;
        }
      }

      // Standard Error object
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