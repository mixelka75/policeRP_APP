// src/components/layout/Layout.tsx - ИСПРАВЛЕННАЯ версия для мобильных устройств
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, RefreshCw, MessageCircle, AlertTriangle, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui';
import { getDisplayName, getRoleDisplayName, isUserDataOutdated } from '@/utils';
import { cn } from '@/utils';
import UserAvatar from '@/components/common/UserAvatar';
import logoImage from '@/assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, actions }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, refreshUserData } = useAuthStore();

  const handleRefreshUserData = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      await refreshUserData();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDataOutdated = user ? isUserDataOutdated(user) : false;

  return (
    <div className="min-h-screen bg-minecraft-dark">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-col min-h-screen lg:ml-64 relative">
        {/* ✨ ИСПРАВЛЕННЫЙ Header для мобильных */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-primary-500/30 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side - адаптивный для мобильных */}
              <div className="flex items-center min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-2 flex-shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {title && (
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <img
                      src={logoImage}
                      alt="Панд-Ратония Logo"
                      className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 object-contain drop-shadow-lg flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-white truncate">
                        {title}
                      </h1>
                      {subtitle && (
                        <p className="text-xs sm:text-sm text-gray-300 truncate hidden sm:block">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - упрощенный для мобильных */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {/* ✨ Кнопка обновления только на больших экранах */}
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshUserData}
                    disabled={isRefreshing}
                    className={cn(
                      "p-2 hidden sm:flex",
                      isDataOutdated && "text-warning-400 hover:text-warning-300"
                    )}
                    title={isDataOutdated ? "Данные пользователя устарели" : "Обновить данные"}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4",
                      isRefreshing && "animate-spin",
                      isDataOutdated && "animate-pulse"
                    )} />
                  </Button>
                )}

                {/* ✨ Упрощенная информация о пользователе для мобильных */}
                <div className="flex items-center space-x-2">
                  {user ? (
                    <>
                      <UserAvatar
                        user={user}
                        size={24}
                        showStatus={true}
                        className="sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                      />

                      {/* Информация о пользователе только на больших экранах */}
                      <div className="hidden lg:block min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-white truncate">
                            {getDisplayName(user)}
                          </p>
                          <MessageCircle className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                          {isDataOutdated && (
                            <AlertTriangle className="h-3 w-3 text-warning-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-300 truncate">
                            {getRoleDisplayName(user.role)}
                          </p>
                          {isDataOutdated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-500/20 text-warning-400 flex-shrink-0">
                              Устарело
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-sm font-medium text-white">
                          Не авторизован
                        </p>
                        <p className="text-xs text-gray-300">
                          Гость
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ✨ ИСПРАВЛЕННОЕ предупреждение об устаревших данных - скрыто на мобильных */}
        {user && isDataOutdated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning-500/10 border-b border-warning-500/20 px-4 sm:px-6 lg:px-8 py-2 hidden sm:block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-warning-400" />
                <span className="text-sm text-warning-400">
                  Данные пользователя устарели. Рекомендуется обновить.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshUserData}
                disabled={isRefreshing}
                className="text-warning-400 hover:text-warning-300"
              >
                {isRefreshing ? 'Обновление...' : 'Обновить'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ✨ ИСПРАВЛЕННАЯ панель действий для мобильных */}
        {actions && (
          <div className="bg-black/20 border-b border-primary-500/30 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex-shrink-0">
            {/* Контейнер с горизонтальной прокруткой для мобильных */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {actions}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 backdrop-blur-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;