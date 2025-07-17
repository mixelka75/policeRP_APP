import { useEffect, useState } from 'react';
import { useSSE, SSEEvent } from './useSSE';
import { useAuthStore } from '@/store/auth';
import { User } from '@/types';

export interface RoleUpdateEvent {
  user_id: number;
  old_role: string;
  new_role: string;
  timestamp: number;
  user_data: {
    discord_username: string;
    minecraft_username?: string;
    is_active: boolean;
  };
}

export function useRoleUpdates() {
  const [lastRoleUpdate, setLastRoleUpdate] = useState<RoleUpdateEvent | null>(null);
  const [roleUpdateHistory, setRoleUpdateHistory] = useState<RoleUpdateEvent[]>([]);
  const { user: currentUser, updateUser } = useAuthStore();

  const handleSSEMessage = (event: SSEEvent) => {
    switch (event.event) {
      case 'connected':
        console.log('Connected to role updates stream');
        break;
        
      case 'role_update':
        const roleUpdate: RoleUpdateEvent = event.data;
        console.log('Role update received:', roleUpdate);
        
        setLastRoleUpdate(roleUpdate);
        setRoleUpdateHistory(prev => [roleUpdate, ...prev.slice(0, 49)]); // Последние 50 обновлений
        
        // Если это обновление для текущего пользователя, обновляем локальные данные
        if (currentUser && roleUpdate.user_id === currentUser.id) {
          const updatedUser: User = {
            ...currentUser,
            role: roleUpdate.new_role as 'admin' | 'police',
            is_active: roleUpdate.user_data.is_active,
            minecraft_username: roleUpdate.user_data.minecraft_username,
            updated_at: new Date().toISOString()
          };
          updateUser(updatedUser);
          
          // Показываем уведомление пользователю
          if (roleUpdate.old_role !== roleUpdate.new_role) {
            console.log(`Your role has been changed from ${roleUpdate.old_role} to ${roleUpdate.new_role}`);
          }
        }
        break;
        
      case 'heartbeat':
        // Heartbeat для поддержания соединения
        break;
        
      case 'error':
        console.error('SSE error:', event.data);
        break;
        
      default:
        console.log('Unknown SSE event:', event.event, event.data);
    }
  };

  const { isConnected, error, reconnectAttempts, disconnect, reconnect } = useSSE(
    '/api/v1/events/role-updates',
    {
      onMessage: handleSSEMessage,
      onError: (error) => {
        console.error('Role updates SSE error:', error);
      },
      onOpen: () => {
        console.log('Role updates SSE connection opened');
      },
      onClose: () => {
        console.log('Role updates SSE connection closed');
      }
    }
  );

  const clearHistory = () => {
    setRoleUpdateHistory([]);
    setLastRoleUpdate(null);
  };

  return {
    isConnected,
    error,
    reconnectAttempts,
    lastRoleUpdate,
    roleUpdateHistory,
    clearHistory,
    disconnect,
    reconnect
  };
}