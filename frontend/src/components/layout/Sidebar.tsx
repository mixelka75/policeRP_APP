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
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

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
      name: 'Логи',
      href: '/logs',
      icon: Activity,
      current: location.pathname === '/logs',
      adminOnly: true,
    },
    {
      name: 'Пользователи',
      href: '/users',
      icon: UserCheck,
      current: location.pathname === '/users',
      adminOnly: true,
    },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  const filteredItems = navigationItems.filter(item =>
    !item.adminOnly || user?.role === 'admin'
  );

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
              <div>
                <h1 className="text-lg font-bold text-white">PR Police</h1>
                <p className="text-xs text-dark-400">Система управления</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-dark-600 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-dark-400 capitalize">
                  {user?.role === 'admin' ? 'Администратор' : 'Полицейский'}
                </p>
              </div>
            </div>
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
              >
                <item.icon
                  className={cn('h-5 w-5', {
                    'text-primary-400': item.current,
                    'text-dark-400 group-hover:text-white': !item.current,
                  })}
                />
                <span className="font-medium">{item.name}</span>
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