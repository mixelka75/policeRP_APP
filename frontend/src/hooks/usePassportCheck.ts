// src/hooks/usePassportCheck.ts
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Passport } from '@/types';

interface UsePassportCheckResult {
  hasPassport: boolean;
  passport: Passport | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePassportCheck = (): UsePassportCheckResult => {
  const [hasPassport, setHasPassport] = useState(false);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPassport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const passportData = await apiService.getMyPassport();
      setPassport(passportData);
      setHasPassport(true);
    } catch (err: any) {
      // Если паспорт не найден, это нормально
      if (err?.status === 404) {
        setPassport(null);
        setHasPassport(false);
        setError(null);
      } else {
        setPassport(null);
        setHasPassport(false);
        setError(err?.detail || 'Ошибка при загрузке паспорта');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPassport();
  }, []);

  return {
    hasPassport,
    passport,
    isLoading,
    error,
    refetch: fetchPassport,
  };
};