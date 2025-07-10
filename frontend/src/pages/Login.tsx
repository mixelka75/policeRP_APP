// src/pages/Login.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, Eye, EyeOff, Shield } from 'lucide-react';
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

    if (!credentials.username || !credentials.password) {
      return;
    }

    try {
      await login(credentials);
    } catch (error) {
      // Error handling is done in the store
      console.error('Login error:', error);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({ ...prev, username: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({ ...prev, password: e.target.value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">РП Сервер</h1>
            <p className="text-gray-400">Система управления паспортами и штрафами</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Имя пользователя"
              type="text"
              placeholder="Введите имя пользователя"
              value={credentials.username}
              onChange={handleUsernameChange}
              leftIcon={<User className="w-5 h-5" />}
              required
              disabled={isLoading}
              fullWidth
            />

            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="Введите пароль"
              value={credentials.password}
              onChange={handlePasswordChange}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
              disabled={isLoading}
              fullWidth
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              fullWidth
              size="lg"
              leftIcon={!isLoading ? <LogIn className="w-5 h-5" /> : undefined}
            >
              Войти в систему
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Логин по умолчанию: <span className="font-mono text-primary-400">admin</span> / <span className="font-mono text-primary-400">admin123</span>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;