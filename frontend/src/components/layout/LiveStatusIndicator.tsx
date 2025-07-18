import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useRoleUpdates } from '@/hooks/useRoleUpdates';

export const LiveStatusIndicator: React.FC = () => {
  const { isConnected, error } = useRoleUpdates();

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-400">
        <WifiOff className="h-4 w-4" />
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-warning-400">
        <div className="w-4 h-4 relative">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-warning-400 border-t-transparent" />
        </div>
        <span className="text-xs">Подключение...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-primary-400">
      <Wifi className="h-4 w-4" />
      <span className="text-xs">Live</span>
      <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
    </div>
  );
};