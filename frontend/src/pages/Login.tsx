// src/pages/Login.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button, Input, Card } from '@/components/ui';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
    } catch (error) {
      // Error handling is done in the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-dark-800/80 backdrop-blur-lg border-gray-700/50">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">РП Сервер</h1>
            <p className="text-gray-400">Система управления паспортами и штрафами</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Имя пользователя"
              type="text"
              placeholder="Введите имя пользователя"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="Введите пароль"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              Войти в систему
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Логин по умолчанию: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;

// src/pages/Dashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, AlertTriangle, Activity } from 'lucide-react';
import { Card } from '@/components/ui';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Паспорта', value: '1,234', icon: FileText, color: 'text-blue-400' },
    { label: 'Штрафы', value: '567', icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Пользователи', value: '12', icon: Users, color: 'text-green-400' },
    { label: 'Активность', value: '89%', icon: Activity, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Панель управления</h1>
          <p className="text-gray-400">Добро пожаловать в систему управления РП сервером</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-dark-800/80 backdrop-blur-lg border-gray-700/50">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg bg-dark-700 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-dark-800/80 backdrop-blur-lg border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Последние действия</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Создан паспорт #1234</span>
                <span className="text-gray-500 text-sm">2 мин назад</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Выписан штраф #567</span>
                <span className="text-gray-500 text-sm">5 мин назад</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Обновлен пользователь</span>
                <span className="text-gray-500 text-sm">10 мин назад</span>
              </div>
            </div>
          </Card>

          <Card className="bg-dark-800/80 backdrop-blur-lg border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Быстрые действия</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors">
                Создать новый паспорт
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors">
                Выписать штраф
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors">
                Просмотреть отчеты
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// src/pages/Passports.tsx
import React from 'react';
import { Card } from '@/components/ui';

const Passports: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Паспорта жителей</h1>
          <p className="text-gray-400">Управление паспортами жителей сервера</p>
        </div>

        <Card>
          <p className="text-gray-300">Функционал в разработке...</p>
        </Card>
      </div>
    </div>
  );
};

export default Passports;

// src/pages/Fines.tsx
import React from 'react';
import { Card } from '@/components/ui';

const Fines: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Штрафы</h1>
          <p className="text-gray-400">Управление штрафами и нарушениями</p>
        </div>

        <Card>
          <p className="text-gray-300">Функционал в разработке...</p>
        </Card>
      </div>
    </div>
  );
};

export default Fines;

// src/pages/Users.tsx
import React from 'react';
import { Card } from '@/components/ui';

const Users: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Пользователи</h1>
          <p className="text-gray-400">Управление пользователями системы</p>
        </div>

        <Card>
          <p className="text-gray-300">Функционал в разработке...</p>
        </Card>
      </div>
    </div>
  );
};

export default Users;

// src/pages/Logs.tsx
import React from 'react';
import { Card } from '@/components/ui';

const Logs: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Логи системы</h1>
          <p className="text-gray-400">Просмотр действий пользователей</p>
        </div>

        <Card>
          <p className="text-gray-300">Функционал в разработке...</p>
        </Card>
      </div>
    </div>
  );
};

export default Logs;