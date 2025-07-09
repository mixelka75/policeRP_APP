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

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await apiFunction(...args);

        setState({
          data: result,
          isLoading: false,
          error: null,
        });

        if (options?.showSuccessToast) {
          toast.success(options.successMessage || 'Операция выполнена успешно');
        }

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        setState({
          data: null,
          isLoading: false,
          error: errorMessage,
        });

        if (options?.showErrorToast !== false) {
          toast.error(errorMessage);
        }

        if (options?.onError) {
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