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
  
  // Discord-specific states
  isDiscordConfigured: boolean;
  discordAuthUrl: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>; // Deprecated but kept for compatibility
  loginWithDiscord: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshUserData: () => Promise<void>; // New method for Discord refresh
  updateUser: (user: User) => void; // New method for updating user data
  clearError: () => void;
  checkAuth: () => void;
  handleDiscordCallback: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isDiscordConfigured: false,
      discordAuthUrl: null,

      // ❌ DEPRECATED: Старый метод логина (сохранен для совместимости)
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

          toast.success(`Добро пожаловать, ${response.user.discord_username}!`);
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

      // ✅ NEW: Discord OAuth логин
      loginWithDiscord: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.getDiscordLoginUrl();

          set({
            discordAuthUrl: response.oauth_url,
            isDiscordConfigured: true,
            isLoading: false,
            error: null,
          });

          // Сохраняем state для проверки безопасности
          localStorage.setItem('discord_auth_state', response.state);

          // Перенаправляем на Discord OAuth
          window.location.href = response.oauth_url;
        } catch (error) {
          const apiError = error as ApiError;
          const errorMessage = apiError.detail || 'Ошибка подключения к Discord';

          set({
            isLoading: false,
            error: errorMessage,
            isDiscordConfigured: false,
          });

          toast.error(errorMessage);
          throw error;
        }
      },

      // ✅ NEW: Обработка callback от Discord
      handleDiscordCallback: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          // Сохраняем токен
          localStorage.setItem('token', token);

          // Получаем данные пользователя
          const user = await apiService.getMe();

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem('user', JSON.stringify(user));

          toast.success(`Добро пожаловать, ${user.discord_username}!`);
        } catch (error) {
          const apiError = error as ApiError;
          let errorMessage = apiError.detail || 'Ошибка при получении данных пользователя';
          
          // Специальная обработка ошибок аутентификации
          if (apiError.status === 403) {
            if (errorMessage.includes('необходимых ролей')) {
              errorMessage = 'У вас нет необходимых ролей для доступа к системе';
            } else if (errorMessage.includes('проверить роли')) {
              errorMessage = 'Не удалось проверить роли пользователя';
            }
          } else if (apiError.status === 500 && errorMessage.includes('не настроен')) {
            errorMessage = 'Сервер не настроен для проверки ролей';
          }

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
          discordAuthUrl: null,
        });

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('discord_auth_state');

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
          if (error && typeof error === 'object' && 'code' in error && error.code === 'SESSION_EXPIRED') {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } else {
            get().logout();
          }
        }
      },

      // ✅ NEW: Обновление данных пользователя через Discord API
      refreshUserData: async () => {
        const { token, user } = get();
        if (!token || isTokenExpired(token) || !user) {
          get().logout();
          return;
        }

        try {
          const response = await apiService.refreshUserData();
          set({ user: response.user, error: null });
          localStorage.setItem('user', JSON.stringify(response.user));

          toast.success('Данные пользователя обновлены');
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          const apiError = error as ApiError;

          if (apiError.code === 'SESSION_EXPIRED' || apiError.status === 403) {
            // Если пользователь потерял доступ, выходим из системы
            get().logout();
            if (apiError.status === 403) {
              toast.error('Ваши роли изменились. Необходимо войти заново');
            }
          } else {
            toast.error(apiError.detail || 'Ошибка при обновлении данных');
          }
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (user: User) => {
        set({ user, error: null });
        localStorage.setItem('user', JSON.stringify(user));
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
          localStorage.removeItem('discord_auth_state');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isDiscordConfigured: state.isDiscordConfigured,
      }),
    }
  )
);