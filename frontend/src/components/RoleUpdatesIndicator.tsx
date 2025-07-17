import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Wifi, WifiOff, Bell, X, User, Clock } from 'lucide-react';
import { useRoleUpdates, RoleUpdateEvent } from '@/hooks/useRoleUpdates';
import { formatRelativeTime } from '@/utils';

interface RoleUpdatesIndicatorProps {
  showHistory?: boolean;
  className?: string;
}

export const RoleUpdatesIndicator: React.FC<RoleUpdatesIndicatorProps> = ({ 
  showHistory = false, 
  className = "" 
}) => {
  const { 
    isConnected, 
    error, 
    lastRoleUpdate, 
    roleUpdateHistory, 
    clearHistory 
  } = useRoleUpdates();

  const getConnectionStatusColor = () => {
    if (error) return 'text-red-400';
    if (isConnected) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getConnectionStatusText = () => {
    if (error) return 'Ошибка соединения';
    if (isConnected) return 'Подключено';
    return 'Подключение...';
  };

  const formatRoleChange = (roleUpdate: RoleUpdateEvent) => {
    const { old_role, new_role } = roleUpdate;
    
    if (old_role === new_role) {
      return `Роль подтверждена: ${new_role}`;
    }
    
    const roleNames = {
      admin: 'Администратор',
      police: 'Полицейский',
      none: 'Нет доступа'
    };
    
    return `${roleNames[old_role as keyof typeof roleNames] || old_role} → ${roleNames[new_role as keyof typeof roleNames] || new_role}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
            {getConnectionStatusText()}
          </span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-xs text-dark-400">Live</span>
          </div>
        </div>
        
        {showHistory && roleUpdateHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-dark-400 hover:text-dark-200 transition-colors"
          >
            Очистить историю
          </button>
        )}
      </div>

      {/* Latest Update */}
      <AnimatePresence>
        {lastRoleUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-400">
                    {lastRoleUpdate.user_data.discord_username}
                  </span>
                  {lastRoleUpdate.user_data.minecraft_username && (
                    <>
                      <span className="text-dark-400">•</span>
                      <span className="text-xs text-dark-300">
                        {lastRoleUpdate.user_data.minecraft_username}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-blue-300">
                  {formatRoleChange(lastRoleUpdate)}
                </p>
                <p className="text-xs text-dark-400">
                  {formatRelativeTime(new Date(lastRoleUpdate.timestamp * 1000).toISOString())}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {showHistory && roleUpdateHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-dark-200 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            История обновлений
          </h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {roleUpdateHistory.slice(0, 20).map((roleUpdate, index) => (
              <motion.div
                key={`${roleUpdate.user_id}-${roleUpdate.timestamp}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-700/50 border border-dark-600 rounded-lg p-2"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-dark-200">
                        {roleUpdate.user_data.discord_username}
                      </span>
                      {roleUpdate.user_data.minecraft_username && (
                        <>
                          <span className="text-dark-500">•</span>
                          <span className="text-xs text-dark-400">
                            {roleUpdate.user_data.minecraft_username}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-dark-300">
                      {formatRoleChange(roleUpdate)}
                    </p>
                    <p className="text-xs text-dark-500">
                      {formatRelativeTime(new Date(roleUpdate.timestamp * 1000).toISOString())}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No Updates */}
      {!lastRoleUpdate && isConnected && (
        <div className="text-center py-4">
          <Bell className="h-8 w-8 text-dark-500 mx-auto mb-2" />
          <p className="text-sm text-dark-400">
            Ожидание обновлений ролей...
          </p>
        </div>
      )}
    </div>
  );
};