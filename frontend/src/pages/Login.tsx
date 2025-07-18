// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, MessageCircle, AlertTriangle, Clock, CheckCircle, X, Gamepad2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button, Card, Badge, Loading } from '@/components/ui';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';

const Login: React.FC = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [callbackLoading, setCallbackLoading] = useState(false);

  const { isLoading, error } = useAuthStore();

  const { execute: getDiscordLoginUrl, isLoading: isGettingUrl } = useApi(
    apiService.getDiscordLoginUrl,
    {
      showErrorToast: true,
      onSuccess: (data) => {
        localStorage.setItem('discord_auth_state', data.state);
        setIsRedirecting(true);
        window.location.href = data.oauth_url;
      },
    }
  );

  const { execute: getDiscordStatus, data: discordStatus } = useApi(
    apiService.getDiscordStatus,
    {
      showErrorToast: false,
    }
  );

  useEffect(() => {
    getDiscordStatus();

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      setCallbackLoading(true);
      localStorage.setItem('token', token);

      apiService.getMe()
        .then(user => {
          localStorage.setItem('user', JSON.stringify(user));
          window.location.href = '/dashboard';
        })
        .catch(err => {
          setAuthError('Ошибка при получении данных пользователя');
          localStorage.removeItem('token');
          setCallbackLoading(false);
        });
    } else if (error) {
      setAuthError(decodeURIComponent(error));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDiscordLogin = async () => {
    setAuthError(null);

    if (!discordStatus?.discord_configured) {
      setAuthError('Discord интеграция не настроена');
      return;
    }

    await getDiscordLoginUrl();
  };

  if (callbackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-minecraft-dark">
        <Loading size="lg" text="Завершение авторизации..." />
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-minecraft-dark">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-br from-primary-400 via-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary-glow animate-glow"
          >
            <MessageCircle className="w-10 h-10 text-white animate-pulse" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Переход к Discord</h2>
          <p className="text-gray-300 mb-6">Перенаправляем вас на Discord для авторизации...</p>
          <div className="flex items-center justify-center space-x-3">
            <Clock className="w-5 h-5 text-primary-400 animate-pulse" />
            <span className="text-primary-400 animate-pulse">Подождите...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-minecraft-dark p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary-500/30 rounded-full"
            animate={{
              y: [0, -window.innerHeight],
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card variant="minecraft" className="overflow-hidden">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-400 via-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6 shadow-primary-glow animate-glow"
            >
              <Gamepad2 className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1
              className="text-3xl font-bold text-white mb-2 minecraft-gradient-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Панд-Ратония
            </motion.h1>
            <motion.p
              className="text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Система управления паспортами и штрафами
            </motion.p>
          </div>

          {/* Discord Status */}
          {discordStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <Card variant="glass" className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-primary-400" />
                  Статус интеграции
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Discord</span>
                    <div className="flex items-center space-x-2">
                      {discordStatus.discord_configured ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Badge
                        variant={discordStatus.discord_configured ? "success" : "danger"}
                        size="sm"
                      >
                        {discordStatus.discord_configured ? "Настроен" : "Не настроен"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Сервер</span>
                    <div className="flex items-center space-x-2">
                      {discordStatus.guild_configured ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Badge
                        variant={discordStatus.guild_configured ? "success" : "danger"}
                        size="sm"
                      >
                        {discordStatus.guild_configured ? "Подключен" : "Не подключен"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Роли</span>
                    <div className="flex items-center space-x-2">
                      {discordStatus.roles_configured ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Badge
                        variant={discordStatus.roles_configured ? "success" : "danger"}
                        size="sm"
                      >
                        {discordStatus.roles_configured ? "Настроены" : "Не настроены"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <Button
              onClick={handleDiscordLogin}
              variant="minecraft"
              loading={isLoading || isGettingUrl}
              disabled={!discordStatus?.discord_configured}
              fullWidth
              size="lg"
              glow
              leftIcon={!isLoading && !isGettingUrl ? <MessageCircle className="w-5 h-5" /> : undefined}
            >
              {isLoading || isGettingUrl ? 'Подключение...' : 'Войти через Discord'}
            </Button>

            {!discordStatus?.discord_configured && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-warning-500/10 border border-warning-500/20 rounded-xl p-3"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-warning-400" />
                  <span className="text-sm text-warning-400">
                    Discord интеграция не настроена
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Error Display */}
          {(error || authError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 mt-4"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-danger-400" />
                <div className="flex-1">
                  <span className="text-sm text-danger-400 block">
                    {error || authError}
                  </span>
                  {(error || authError)?.includes('необходимых ролей') && (
                    <p className="text-xs text-danger-300 mt-1">
                      Убедитесь, что у вас есть роль админа или полицейского на Discord сервере
                    </p>
                  )}
                  {(error || authError)?.includes('проверить роли') && (
                    <p className="text-xs text-danger-300 mt-1">
                      Возможно, бот не имеет доступа к информации о ваших ролях
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-400 text-sm">
              Для входа в систему необходимо иметь роль админа или полицейского
            </p>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <Card variant="glass" className="p-4">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-primary-400" />
                Требования для доступа:
              </h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2" />
                  Членство в Discord сервере
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full mr-2" />
                  Роль админа или полицейского на сервере
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-accent-500 rounded-full mr-2" />
                  Активная учетная запись Discord
                </li>
              </ul>
            </Card>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;