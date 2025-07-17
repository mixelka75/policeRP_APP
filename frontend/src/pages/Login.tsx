// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, MessageCircle, AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
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
        // Сохраняем state для проверки безопасности
        localStorage.setItem('discord_auth_state', data.state);

        setIsRedirecting(true);
        // Перенаправляем на Discord OAuth
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
    // Проверяем статус Discord интеграции при загрузке
    getDiscordStatus();

    // Проверяем, есть ли token в URL (после редиректа с Discord)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      setCallbackLoading(true);

      // Сохраняем токен
      localStorage.setItem('token', token);

      // Получаем пользователя
      apiService.getMe()
        .then(user => {
          localStorage.setItem('user', JSON.stringify(user));
          // Перенаправляем на дашборд
          window.location.href = '/dashboard';
        })
        .catch(err => {
          setAuthError('Ошибка при получении данных пользователя');
          localStorage.removeItem('token');
          setCallbackLoading(false);
        });
    } else if (error) {
      setAuthError(decodeURIComponent(error));
      // Очищаем URL
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
        <Loading size="lg" text="Завершение авторизации..." />
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Переход к Discord</h2>
          <p className="text-dark-400 mb-4">Перенаправляем вас на Discord для авторизации...</p>
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-400">Подождите...</span>
          </div>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-white mb-2">PR Police</h1>
            <p className="text-gray-400">Система управления паспортами и штрафами</p>
          </div>

          {/* Discord Status */}
          {discordStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <div className="bg-dark-700/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-white mb-2">Статус интеграции</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-dark-400">Discord</span>
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
                    <span className="text-xs text-dark-400">Сервер</span>
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
                    <span className="text-xs text-dark-400">Роли</span>
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
              </div>
            </motion.div>
          )}

          {/* Login Button */}
          <div className="space-y-4">
            <Button
              onClick={handleDiscordLogin}
              variant="primary"
              loading={isLoading || isGettingUrl}
              disabled={!discordStatus?.discord_configured}
              fullWidth
              size="lg"
              leftIcon={!isLoading && !isGettingUrl ? <MessageCircle className="w-5 h-5" /> : undefined}
            >
              {isLoading || isGettingUrl ? 'Подключение...' : 'Войти через Discord'}
            </Button>

            {!discordStatus?.discord_configured && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">
                    Discord интеграция не настроена
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Error Display */}
          {(error || authError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <div className="flex-1">
                  <span className="text-sm text-red-400 block">
                    {error || authError}
                  </span>
                  {/* Дополнительная информация для ошибок ролей */}
                  {(error || authError)?.includes('необходимых ролей') && (
                    <p className="text-xs text-red-300 mt-1">
                      Убедитесь, что у вас есть роль админа или полицейского на Discord сервере
                    </p>
                  )}
                  {(error || authError)?.includes('проверить роли') && (
                    <p className="text-xs text-red-300 mt-1">
                      Возможно, бот не имеет доступа к информации о ваших ролях
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Для входа в систему необходимо иметь роль админа или полицейского
            </p>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-dark-700/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Требования для доступа:</h4>
            <ul className="text-xs text-dark-400 space-y-1">
              <li>• Членство в Discord сервере</li>
              <li>• Роль админа или полицейского на сервере</li>
              <li>• Активная учетная запись Discord</li>
            </ul>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;