import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { parseJwt } from '@/utils';

const TOKEN_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export const useTokenRefresh = () => {
  const { token, isAuthenticated, refreshToken } = useAuthStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkTokenExpiration = () => {
      if (!token) return;

      try {
        const payload = parseJwt(token);
        if (!payload || !payload.exp) return;

        const currentTime = Date.now();
        const expirationTime = payload.exp * 1000;
        const timeUntilExpiration = expirationTime - currentTime;

        // If token expires within threshold, refresh token
        if (timeUntilExpiration > 0 && timeUntilExpiration < TOKEN_REFRESH_THRESHOLD) {
          console.log('Token approaching expiration, refreshing token...');
          refreshToken().catch(error => {
            console.error('Failed to refresh token:', error);
          });
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up periodic checks
    intervalRef.current = setInterval(checkTokenExpiration, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, isAuthenticated, refreshToken]);

  return null;
};