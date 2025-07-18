// src/pages/DiscordCallback.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Loading, Card } from '@/components/ui';

const DiscordCallback: React.FC = () => {
  const navigate = useNavigate();
  const { handleDiscordCallback, isLoading, error } = useAuthStore();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        const savedState = localStorage.getItem('discord_auth_state');
        if (state && savedState && state !== savedState) {
          throw new Error('Invalid state parameter');
        }

        localStorage.removeItem('discord_auth_state');

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (!token) {
          throw new Error('Не получен токен авторизации');
        }

        await handleDiscordCallback(token);
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Discord callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [handleDiscordCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-minecraft-dark p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-dark-800/70 backdrop-blur-lg border-red-400/30">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-300" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Ошибка авторизации</h2>
              <p className="text-dark-300 mb-4">{error}</p>

              {error?.includes('необходимых ролей') && (
                <div className="bg-warning-400/10 border border-warning-400/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-warning-300">
                    <strong>Что делать:</strong> Обратитесь к администратору Discord сервера
                    для получения роли админа или полицейского
                  </p>
                </div>
              )}

              {error?.includes('проверить роли') && (
                <div className="bg-secondary-400/10 border border-secondary-400/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-secondary-300">
                    <strong>Возможное решение:</strong> Попробуйте войти еще раз или
                    обратитесь к администратору системы
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Вернуться к входу
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-minecraft-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-primary-glow animate-glow">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-4">Авторизация через Discord</h2>
        <p className="text-dark-300 mb-8">Завершаем процесс авторизации и настраиваем ваш профиль...</p>

        <div className="space-y-4 max-w-md mx-auto">
          <div className="flex items-center space-x-3 p-3 bg-dark-800/40 rounded-lg">
            <div className="w-6 h-6 bg-secondary-400/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-secondary-300" />
            </div>
            <span className="text-sm text-dark-300">Получение данных Discord</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-dark-800/40 rounded-lg">
            <div className="w-6 h-6">
              <Loading size="sm" />
            </div>
            <span className="text-sm text-dark-300">Проверка ролей на сервере</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-dark-800/40 rounded-lg opacity-50">
            <div className="w-6 h-6 bg-gray-500/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-sm text-dark-400">Настройка профиля</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DiscordCallback;