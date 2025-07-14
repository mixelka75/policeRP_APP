// src/types/index.ts

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'police';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserCreate {
  username: string;
  password: string;
  role: 'admin' | 'police';
  is_active: boolean;
}

export interface UserUpdate {
  username?: string;
  password?: string;
  role?: 'admin' | 'police';
  is_active?: boolean;
}

export interface Passport {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  age: number;
  gender: 'male' | 'female';
  city: string;
  violations_count: number;
  entry_date: string;
  is_emergency: boolean;
  created_at: string;
  updated_at: string;
}

// ✨ ОБНОВЛЕННЫЙ интерфейс PassportCreate с entry_date
export interface PassportCreate {
  first_name: string;
  last_name: string;
  nickname: string;
  age: number;
  gender: 'male' | 'female';
  city: string;
  entry_date?: string;  // ✨ НОВОЕ ПОЛЕ: дата въезда (опциональное)
}

// ✨ ОБНОВЛЕННЫЙ интерфейс PassportUpdate
export interface PassportUpdate {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female';
  city?: string;
  entry_date?: string;  // ✨ НОВОЕ ПОЛЕ: дата въезда
}

// Интерфейсы для работы с ЧС
export interface PassportEmergencyUpdate {
  is_emergency: boolean;
  reason?: string;
}

export interface PassportEmergencyResponse {
  id: number;
  nickname: string;
  is_emergency: boolean;
  message: string;
}

export interface Fine {
  id: number;
  passport_id: number;
  article: string;
  amount: number;
  description?: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface FineCreate {
  passport_id: number;
  article: string;
  amount: number;
  description?: string;
}

export interface FineUpdate {
  article?: string;
  amount?: number;
  description?: string;
}

export interface Log {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ApiError {
  detail: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}