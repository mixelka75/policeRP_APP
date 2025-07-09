// src/utils/index.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatString: string = 'dd.MM.yyyy HH:mm') {
  return format(new Date(date), formatString, { locale: ru });
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: ru 
  });
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function validateForm(data: Record<string, any>, rules: Record<string, any>) {
  const errors: Record<string, string> = {};
  
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
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'detail' in error) {
    return (error as any).detail;
  }
  return 'Произошла неизвестная ошибка';
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}