// src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, ApiError } from '@/types';
import { apiService } from '@/services/api';
import { isTokenExpired } from '@/utils';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.loginJson(credentials);
          
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem('token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          toast.success(`Добро пожаловать, ${response.user.username}!`);
        } catch (error) {
          const apiError = error as ApiError;
          const errorMessage = apiError.detail || 'Ошибка авторизации';
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast.success('Вы вышли из системы');
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token || isTokenExpired(token)) {
          get().logout();
          return;
        }

        try {
          const user = await apiService.getMe();
          set({ user, error: null });
        } catch (error) {
          console.error('Failed to refresh user:', error);
          get().logout();
        }
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr && !isTokenExpired(token)) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
              error: null,
            });
          } catch (error) {
            console.error('Failed to parse user from localStorage:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);