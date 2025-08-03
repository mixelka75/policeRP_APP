// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { ApiError } from '@/types';
import { getErrorMessage } from '@/utils';
import toast from 'react-hot-toast';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Проверяем, что apiFunction существует и является функцией
        if (!apiFunction || typeof apiFunction !== 'function') {
          throw new Error('API function is not provided or is not a function');
        }

        const result = await apiFunction(...args);

        setState({
          data: result,
          isLoading: false,
          error: null,
        });

        if (options.showSuccessToast) {
          toast.success(options.successMessage || 'Операция выполнена успешно');
        }

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        console.error('API Error:', error);
        console.error('API Error detail:', (error as any)?.detail);
        console.error('API Error full object:', JSON.stringify(error, null, 2));

        let errorMessage: string;
        let shouldShowToast = options.showErrorToast !== false;

        // ✨ Обработка различных типов ошибок с особым вниманием к истекшим токенам
        if (error && typeof error === 'object' && 'detail' in error) {
          const apiError = error as ApiError;
          
          // Обработка ошибок валидации Pydantic (массив объектов)
          if (Array.isArray(apiError.detail)) {
            errorMessage = apiError.detail
              .map(err => typeof err === 'object' ? err.msg || 'Ошибка валидации' : String(err))
              .join(', ');
          } else {
            errorMessage = String(apiError.detail);
          }

          // ✨ Если это ошибка истекшей сессии, не показываем тост
          if (apiError.code === 'SESSION_EXPIRED') {
            shouldShowToast = false;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = 'Произошла неизвестная ошибка';
        }

        setState({
          data: null,
          isLoading: false,
          error: errorMessage,
        });

        // ✨ Показываем тост только если это не истекшая сессия
        if (shouldShowToast) {
          toast.error(errorMessage);
        }

        if (options.onError) {
          options.onError(errorMessage);
        }

        throw error;
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi;