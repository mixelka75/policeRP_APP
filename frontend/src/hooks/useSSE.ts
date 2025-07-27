import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';

export interface SSEEvent {
  event: string;
  data: any;
}

export interface SSEHookOptions {
  onMessage?: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useSSE(endpoint: string, options: SSEHookOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuthStore();
  
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const connect = () => {
    if (!token) {
      console.warn('No auth token available for SSE connection');
      return;
    }

    try {
      // Создаем URL для SSE
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = new URL(`/api/v1${endpoint}`, API_URL);
      
      // EventSource не поддерживает заголовки, поэтому передаем токен в query
      url.searchParams.append('token', token);
      
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        setIsConnected(false);
        setError('Connection error');
        onError?.(event);
        
        // Попытка переподключения
        if (reconnectAttempts < maxReconnectAttempts) {
          console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        } else {
          console.error('Max reconnection attempts reached');
          setError('Max reconnection attempts reached');
        }
      };

    } catch (err) {
      console.error('Failed to create SSE connection:', err);
      setError('Failed to create connection');
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      onClose?.();
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, endpoint]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    error,
    reconnectAttempts,
    disconnect,
    reconnect: connect
  };
}