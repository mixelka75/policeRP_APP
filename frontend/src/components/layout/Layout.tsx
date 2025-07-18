// src/components/layout/Layout.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, RefreshCw, MessageCircle, AlertTriangle, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui';
import { getDisplayName, getRoleDisplayName, isUserDataOutdated } from '@/utils';
import { cn } from '@/utils';

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
    <div className="min-h-screen bg-minecraft-dark flex">
      {/* Sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="hidden lg:block lg:w-64">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* ✨ ОБНОВЛЕННЫЙ Header с новой цветовой схемой */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-primary-500/30 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-3"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {title && (
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm text-gray-300 mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* ✨ ОБНОВЛЕННАЯ кнопка обновления пользователя */}
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshUserData}
                    disabled={isRefreshing}
                    className={cn(
                      "p-2",
                      // ✨ НОВЫЕ цвета для устаревших данных
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

                {/* ✨ ОБНОВЛЕННАЯ информация о пользователе */}
                <div className="flex items-center space-x-3">
                  {user ? (
                    <>
                      {/* ✨ ОБНОВЛЕННАЯ иконка пользователя */}
                      <div className="relative">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          user.role === 'admin'
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-primary-500 to-secondary-500' // ✨ НОВЫЙ градиент для полицейских
                        )}>
                          <User className="w-4 h-4 text-white" />
                        </div>

                        {/* Status indicator */}
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900",
                          user.is_active ? "bg-green-500" : "bg-red-500"
                        )} />
                      </div>

                      {/* ✨ ОБНОВЛЕННЫЕ детали пользователя */}
                      <div className="hidden sm:block">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-white">
                            {getDisplayName(user)}
                          </p>
                          <MessageCircle className="h-3 w-3 text-secondary-400" /> {/* ✨ НОВЫЙ цвет */}
                          {isDataOutdated && (
                            <AlertTriangle className="h-3 w-3 text-warning-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-300">
                            {getRoleDisplayName(user.role)}
                          </p>
                          {isDataOutdated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-500/20 text-warning-400">
                              Устарело
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="hidden sm:block">
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

        {/* ✨ ОБНОВЛЕННОЕ предупреждение об устаревших данных */}
        {user && isDataOutdated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning-500/10 border-b border-warning-500/20 px-4 sm:px-6 lg:px-8 py-2"
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

        {/* ✨ ОБНОВЛЕННАЯ панель действий */}
        {actions && (
          <div className="bg-black/20 border-b border-primary-500/30 px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
            {actions}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 backdrop-blur-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;