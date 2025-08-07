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
              {/* Mobile menu button - только на мобильных */}
              <div className="flex items-center justify-center w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden absolute left-4 flex-shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Центрированный заголовок с логотипом */}
                {title && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={logoImage}
                      alt="Панд-Ратония Logo"
                      className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 object-contain drop-shadow-lg flex-shrink-0"
                    />
                    <div className="text-center">
                      <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-white">
                        {title}
                      </h1>
                      {subtitle && (
                        <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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