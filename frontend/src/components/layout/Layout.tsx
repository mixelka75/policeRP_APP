// src/components/layout/Layout.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Sidebar from './Sidebar';
import { Button, Input } from '@/components/ui';
import { cn } from '@/utils';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, actions }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="hidden lg:block lg:w-64">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-dark-900/50 backdrop-blur-sm border-b border-dark-600 flex-shrink-0">
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
                      <p className="text-sm text-dark-400 mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">


                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {user?.username}
                    </p>
                    <p className="text-xs text-dark-400 capitalize">
                      {user?.role === 'admin' ? 'Администратор' : 'Полицейский'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Actions Bar */}
        {actions && (
          <div className="bg-dark-900/30 border-b border-dark-600 px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
            {actions}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;