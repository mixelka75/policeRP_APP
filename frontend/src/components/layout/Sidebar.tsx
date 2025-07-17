// src/components/layout/Sidebar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  AlertTriangle,
  Settings,
  LogOut,
  Shield,
  Activity,
  UserCheck,
  ShieldAlert,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getDiscordAvatarUrl, getDisplayName, getRoleDisplayName, getFullUserName, isUserDataOutdated } from '@/utils';
import { cn } from '@/utils';
import { LiveStatusIndicator } from './LiveStatusIndicator';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout, refreshUserData } = useAuthStore();

  const navigationItems = [
    {
      name: 'Главная',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Паспорта',
      href: '/passports',
      icon: Users,
      current: location.pathname === '/passports',
    },
    {
      name: 'Штрафы',
      href: '/fines',
      icon: AlertTriangle,
      current: location.pathname === '/fines',
    },
    {
      name: 'Список ЧС',
      href: '/emergency',
      icon: ShieldAlert,
      current: location.pathname === '/emergency',
      description: 'Управление паспортами в ЧС',
    },
    {
      name: 'Пользователи',
      href: '/users',
      icon: UserCheck,
      current: location.pathname === '/users',
      adminOnly: true,
    },
    {
      name: 'Роли Discord',
      href: '/roles',
      icon: Settings,
      current: location.pathname === '/roles',
      adminOnly: true,
      description: 'Управление ролями Discord',
    },
    {
      name: 'Логи',
      href: '/logs',
      icon: Activity,
      current: location.pathname === '/logs',
      adminOnly: true,
    },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleRefreshUserData = async () => {
    if (!user) return;

    try {
      await refreshUserData();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const filteredItems = navigationItems.filter(item =>
    !item.adminOnly || user?.role === 'admin'
  );

  const isDataOutdated = user ? isUserDataOutdated(user) : false;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-dark-800 border-r border-dark-600 shadow-xl lg:translate-x-0 lg:static lg:inset-0 lg:h-screen"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-dark-600 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-white">PR Police</h1>
                <p className="text-xs text-dark-400">Система управления</p>
              </div>
              <div className="flex-shrink-0">
                <LiveStatusIndicator />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-dark-600 flex-shrink-0">
            {user ? (
              <div className="space-y-3">
                {/* User Avatar and Name */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {/* Discord Avatar */}
                    <img
                      src={getDiscordAvatarUrl(user, 40)}
                      alt={`${getDisplayName(user)} avatar`}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {/* Fallback avatar */}
                    <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {getDisplayName(user).charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Status indicator */}
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800",
                      user.is_active ? "bg-green-500" : "bg-red-500"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-white truncate">
                        {getDisplayName(user)}
                      </p>
                      {isDataOutdated && (
                        <AlertCircle className="h-3 w-3 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-xs text-dark-400 capitalize">
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                </div>

                {/* Discord Info */}
                <div className="bg-dark-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-dark-300 truncate">
                      {getFullUserName(user)}
                    </span>
                  </div>

                  {user.minecraft_username && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center">
                        <span className="text-xs text-white font-bold">MC</span>
                      </div>
                      <span className="text-xs text-dark-300 truncate">
                        {user.minecraft_username}
                      </span>
                    </div>
                  )}

                  {isDataOutdated && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-yellow-400">
                        Данные устарели
                      </span>
                      <button
                        onClick={handleRefreshUserData}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* User Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefreshUserData}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                    title="Обновить данные"
                  >
                    <RefreshCw className="h-4 w-4 text-dark-400" />
                    <span className="text-xs text-dark-300">Обновить</span>
                  </button>
                  {user.discord_id && (
                    <a
                      href={`https://discord.com/users/${user.discord_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                      title="Открыть профиль в Discord"
                    >
                      <ExternalLink className="h-4 w-4 text-dark-400" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-medium text-sm">?</span>
                </div>
                <p className="text-sm font-medium text-white">Не авторизован</p>
                <p className="text-xs text-dark-400">Гость</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                  'hover:bg-dark-700 group',
                  {
                    'bg-primary-500/10 border border-primary-500/20 text-primary-400':
                      item.current,
                    'text-dark-300 hover:text-white': !item.current,
                  }
                )}
                title={item.description || item.name}
              >
                <item.icon
                  className={cn('h-5 w-5', {
                    'text-primary-400': item.current,
                    'text-dark-400 group-hover:text-white': !item.current,
                    'text-red-400': item.href === '/emergency' && !item.current,
                  })}
                />
                <span className="font-medium">{item.name}</span>
                {item.href === '/emergency' && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-dark-600 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;