// src/pages/RoleManagement.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Activity,
  RefreshCw,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  MessageCircle,
  FileText
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Layout } from '@/components/layout';
import { Button, Card, Badge, StatCard, Loading } from '@/components/ui';
import { RoleUpdatesIndicator } from '@/components/RoleUpdatesIndicator';
import { formatDate, formatRelativeTime, getDiscordAvatarUrl, getDisplayName } from '@/utils';

const RoleManagement: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const {
    data: roleStatus,
    isLoading: statusLoading,
    execute: fetchRoleStatus,
  } = useApi(apiService.getRoleStatus);

  const {
    data: syncIssues,
    isLoading: issuesLoading,
    execute: fetchSyncIssues,
  } = useApi(apiService.getRoleSyncIssues);

  const {
    data: discordStatus,
    execute: fetchDiscordStatus,
  } = useApi(apiService.getDiscordStatus);

  const { execute: checkAllRoles, isLoading: isCheckingAllRoles } = useApi(
    apiService.checkAllRoles,
    {
      showSuccessToast: true,
      successMessage: 'Массовая проверка ролей запущена',
      onSuccess: () => {
        refreshData();
      },
    }
  );

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      await Promise.all([
        fetchRoleStatus(),
        fetchSyncIssues(),
        fetchDiscordStatus()
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh role management data:', error);
    }
  };

  const handleCheckAllRoles = async () => {
    await checkAllRoles();
  };

  const getServiceStatusIcon = (running: boolean) => {
    return running ? (
      <CheckCircle className="h-5 w-5 text-green-400" />
    ) : (
      <XCircle className="h-5 w-5 text-red-400" />
    );
  };

  const getServiceStatusColor = (running: boolean) => {
    return running ? 'text-green-400' : 'text-red-400';
  };

  const stats = [
    {
      title: 'Проверка ролей',
      value: roleStatus?.service_running ? 'Активна' : 'Остановлена',
      icon: roleStatus?.service_running ? Activity : Pause,
      color: roleStatus?.service_running ? 'green' as const : 'red' as const,
    },
    {
      title: 'Интервал проверки',
      value: `${roleStatus?.check_interval_minutes || 0} мин`,
      icon: Clock,
      color: 'blue' as const,
    },
    {
      title: 'Проблемы синхронизации',
      value: syncIssues?.users_with_issues || 0,
      icon: AlertTriangle,
      color: (syncIssues?.users_with_issues || 0) > 0 ? 'red' as const : 'green' as const,
    },
    {
      title: 'Ролей в кэше',
      value: roleStatus?.guild_roles_cached || 0,
      icon: Shield,
      color: 'purple' as const,
    },
  ];

  if (statusLoading || issuesLoading) {
    return (
      <Layout
        title="Управление ролями"
        subtitle="Мониторинг и управление ролями Discord"
      >
        <div className="flex justify-center py-8">
          <Loading text="Загрузка данных о ролях..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Управление ролями"
      subtitle="Мониторинг и управление ролями Discord"
    >
      <div className="space-y-6">
        {/* Refresh Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Обновить данные
            </Button>
            {lastRefresh && (
              <span className="text-sm text-dark-400">
                Последнее обновление: {formatDate(lastRefresh)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCheckAllRoles}
              loading={isCheckingAllRoles}
              leftIcon={<Activity className="h-4 w-4" />}
            >
              Проверить все роли
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Real-time Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Обновления в реальном времени
            </h3>
            <RoleUpdatesIndicator showHistory={true} />
          </Card>
        </motion.div>

        {/* Service Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Статус сервиса
              </h3>
              <div className="flex items-center space-x-2">
                {getServiceStatusIcon(roleStatus?.service_running || false)}
                <span className={`text-sm font-medium ${getServiceStatusColor(roleStatus?.service_running || false)}`}>
                  {roleStatus?.service_running ? 'Работает' : 'Остановлен'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Интервал проверки:</span>
                  <span className="text-dark-200">{roleStatus?.check_interval_minutes || 0} минут</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Последнее обновление кэша:</span>
                  <span className="text-dark-200">
                    {roleStatus?.last_cache_update
                      ? formatRelativeTime(roleStatus.last_cache_update)
                      : 'Неизвестно'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Ролей в кэше:</span>
                  <span className="text-dark-200">{roleStatus?.guild_roles_cached || 0}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Discord интеграция:</span>
                  <div className="flex items-center space-x-2">
                    {discordStatus?.discord_configured ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={discordStatus?.discord_configured ? 'text-green-400' : 'text-red-400'}>
                      {discordStatus?.discord_configured ? 'Настроена' : 'Не настроена'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Гильдия:</span>
                  <div className="flex items-center space-x-2">
                    {discordStatus?.guild_configured ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={discordStatus?.guild_configured ? 'text-green-400' : 'text-red-400'}>
                      {discordStatus?.guild_configured ? 'Подключена' : 'Не подключена'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Роли:</span>
                  <div className="flex items-center space-x-2">
                    {discordStatus?.roles_configured ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={discordStatus?.roles_configured ? 'text-green-400' : 'text-red-400'}>
                      {discordStatus?.roles_configured ? 'Настроены' : 'Не настроены'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sync Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
                Проблемы синхронизации
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant={syncIssues?.users_with_issues ? "danger" : "success"}>
                  {syncIssues?.users_with_issues || 0} пользователей
                </Badge>
                <Badge variant="info">
                  из {syncIssues?.total_users || 0} всего
                </Badge>
              </div>
            </div>

            {syncIssues?.users_with_issues === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 text-lg font-medium mb-2">
                  Проблем синхронизации нет
                </p>
                <p className="text-dark-400">
                  Все пользователи успешно синхронизированы с Discord
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {syncIssues?.issues.map((issue, index) => (
                  <motion.div
                    key={issue.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-white">
                            {issue.discord_username}
                          </h4>
                          {issue.minecraft_username && (
                            <>
                              <span className="text-dark-400">•</span>
                              <span className="text-dark-300">{issue.minecraft_username}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-dark-400 mt-1">
                          Последняя проверка: {formatDate(issue.last_role_check)}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {issue.issues.map((issueType, idx) => (
                            <Badge key={idx} variant="danger" size="sm">
                              {issueType}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Управление
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-400 mb-1">Массовая проверка ролей</h4>
                    <p className="text-sm text-blue-300">
                      Проверить роли всех пользователей в Discord и обновить данные в системе
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCheckAllRoles}
                    loading={isCheckingAllRoles}
                    leftIcon={<Activity className="h-4 w-4" />}
                  >
                    Запустить проверку
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-1">Перезапуск сервиса</h4>
                    <p className="text-sm text-yellow-300">
                      Перезапустить сервис проверки ролей при возникновении проблем
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Перезапустить
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default RoleManagement;