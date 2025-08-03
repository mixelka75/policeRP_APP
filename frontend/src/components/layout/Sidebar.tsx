// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  AlertTriangle,
  LogOut,
  Shield,
  Activity,
  UserCheck,
  ShieldAlert,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  User,
  Gamepad2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getDisplayName, getRoleDisplayName, getFullUserName, isUserDataOutdated } from '@/utils';
import { cn } from '@/utils';
import UserAvatar from '@/components/common/UserAvatar';
import { DiscordIcon } from '@/components/icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout, refreshUserData } = useAuthStore();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Главная',
        href: '/dashboard',
        icon: Home,
        current: location.pathname === '/dashboard',
      }
    ];

    if (user?.role === 'citizen') {
      return [
        ...baseItems,
        {
          name: 'Мои штрафы',
          href: '/my-fines',
          icon: AlertTriangle,
          current: location.pathname === '/my-fines',
        }
      ];
    }

    // Для admin и police
    return [
      ...baseItems,
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
        name: 'Логи',
        href: '/logs',
        icon: Activity,
        current: location.pathname === '/logs',
        adminOnly: true,
      },
    ];
  };

  const navigationItems = getNavigationItems();

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
    !('adminOnly' in item) || !item.adminOnly || user?.role === 'admin'
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

      {/* ✨ ОБНОВЛЕННЫЙ Sidebar с новой цветовой схемой */}
      <motion.div
        initial={false}
        animate={{ 
          x: isLargeScreen ? 0 : (isOpen ? 0 : -300)
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-minecraft-dark border-r border-primary-500/30 shadow-2xl lg:translate-x-0 lg:h-screen"
      >
        <div className="flex flex-col h-full">
          {/* ✨ ОБНОВЛЕННЫЙ Header */}
          <div className="p-6 border-b border-primary-500/30 flex-shrink-0">
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Панд-Ратония</h1>
              <p className="text-xs text-primary-300 mt-1">Система управления</p>
            </div>
          </div>

          {/* ✨ ОБНОВЛЕННАЯ User Info */}
          <div className="p-6 border-b border-primary-500/30 flex-shrink-0">
            {user ? (
              <div className="space-y-4">
                {/* ✨ ОБНОВЛЕННАЯ User Card */}
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-primary-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {/* ✨ Minecraft/Discord аватар пользователя */}
                      <UserAvatar
                        user={user}
                        size={48}
                        showStatus={true}
                        className="shadow-lg"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-white truncate">
                          {getDisplayName(user)}
                        </p>
                        {isDataOutdated && (
                          <AlertCircle className="h-3 w-3 text-warning-400" />
                        )}
                      </div>
                      <p className="text-xs text-primary-300 capitalize"> {/* ✨ НОВЫЙ цвет */}
                        {getRoleDisplayName(user.role)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ✨ ОБНОВЛЕННЫЕ User Details */}
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-primary-500/20 space-y-2">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-secondary-400" /> {/* ✨ НОВЫЙ цвет */}
                    <span className="text-xs text-gray-300 truncate">
                      {getFullUserName(user)}
                    </span>
                  </div>

                  {user.minecraft_username && (
                    <div className="flex items-center space-x-2">
                      <Gamepad2 className="h-4 w-4 text-accent-400" /> {/* ✨ НОВЫЙ цвет */}
                      <span className="text-xs text-gray-300 truncate">
                        {user.minecraft_username}
                      </span>
                    </div>
                  )}

                  {isDataOutdated && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-warning-400">
                        Данные устарели
                      </span>
                      <button
                        onClick={handleRefreshUserData}
                        className="text-warning-400 hover:text-warning-300 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ✨ ОБНОВЛЕННЫЕ Quick Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefreshUserData}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-black/20 hover:bg-black/30 rounded-lg transition-colors border border-primary-500/20"
                    title="Обновить данные"
                  >
                    <RefreshCw className="h-4 w-4 text-primary-400" /> {/* ✨ НОВЫЙ цвет */}
                    <span className="text-xs text-primary-300">Обновить</span> {/* ✨ НОВЫЙ цвет */}
                  </button>
                  {user.discord_id && (
                    <a
                      href={`https://discord.com/users/${user.discord_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 bg-black/20 hover:bg-black/30 rounded-lg transition-colors border border-primary-500/20"
                      title="Открыть профиль в Discord"
                    >
                      <DiscordIcon className="h-4 w-4 text-primary-400" /> {/* ✨ НОВЫЙ цвет */}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-white">Не авторизован</p>
                <p className="text-xs text-gray-300">Гость</p>
              </div>
            )}
          </div>

          {/* ✨ ОБНОВЛЕННАЯ Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                  'hover:bg-black/20 group border border-transparent hover:border-primary-500/20',
                  {
                    // ✨ ОБНОВЛЕННОЕ активное состояние
                    'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border-primary-500/30 text-white shadow-lg':
                      item.current,
                    'text-gray-300 hover:text-white': !item.current,
                  }
                )}
                title={'description' in item ? item.description : item.name}
              >
                <item.icon
                  className={cn('h-5 w-5', {
                    'text-primary-300': item.current, // ✨ НОВЫЙ цвет активной иконки
                    'text-gray-400 group-hover:text-white': !item.current,
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

          {/* ✨ ОБНОВЛЕННЫЙ Footer */}
          <div className="p-4 border-t border-primary-500/30 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20"
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