// src/pages/Logs.tsx - Обновленная цветовая схема
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Activity,
  Eye,
  User,
  FileText,
  AlertTriangle,
  Trash2,
  Plus,
  Edit,
  LogIn,
  Server,
  Calendar,
  Clock,
  Shield,
  ShieldAlert,
  List,
  ShieldCheck,
  Key,
  Loader2
} from 'lucide-react';
import { Log, User as UserType } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Layout } from '@/components/layout';
import { Button, Input, StatCard, Card } from '@/components/ui';
import { FilterModal, FilterOptions } from '@/components/modals';
import { formatDate, formatRelativeTime } from '@/utils';
import LogDetailsModal from '@/components/modals/LogDetailsModal';
import { UserAvatar } from '@/components/common';
import { EXCLUDED_LOG_ACTIONS } from '@/constants/logs';

const Logs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [usersMap, setUsersMap] = useState<Map<number, UserType>>(new Map());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({});
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


  const { execute: fetchUsers } = useApi(apiService.getUsers);

  // Функция для загрузки логов с пагинацией
  const fetchLogsData = useCallback(async (page: number, pageSize: number) => {
    const result = await apiService.getLogs(page, pageSize);
    return {
      data: result.logs,
      pagination: result.pagination
    };
  }, []);

  // Использование infinite scroll
  const {
    data: logs,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    refresh: refreshLogs,
    totalCount
  } = useInfiniteScroll({
    fetchData: fetchLogsData,
    pageSize: 20
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await fetchUsers();
      const map = new Map();
      users.forEach((user: UserType) => {
        map.set(user.id, user);
      });
      setUsersMap(map);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const filteredLogs = logs?.filter(log => {
    const user = usersMap.get(log.user_id);

    // Фильтрация исключенных событий
    if (EXCLUDED_LOG_ACTIONS.includes(log.action as any)) {
      return false;
    }

    // Поиск
    const matchesSearch = !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.discord_username && user.discord_username.toLowerCase().includes(searchTerm.toLowerCase()));

    // Фильтр по действию
    const matchesAction = !selectedAction || log.action === selectedAction;

    // Фильтры
    let matchesFilters = true;

    if (appliedFilters.dateRange?.start) {
      const logDate = new Date(log.created_at);
      const startDate = new Date(appliedFilters.dateRange.start);
      if (logDate < startDate) matchesFilters = false;
    }

    if (appliedFilters.dateRange?.end) {
      const logDate = new Date(log.created_at);
      const endDate = new Date(appliedFilters.dateRange.end);
      if (logDate > endDate) matchesFilters = false;
    }

    // Фильтрация по роли пользователя
    if (appliedFilters.role && user && user.role !== appliedFilters.role) {
      matchesFilters = false;
    }

    return matchesSearch && matchesAction && matchesFilters;
  }) || [];

  const handleApplyFilters = (filters: FilterOptions) => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setAppliedFilters({});
  };

  const handleShowDetails = (log: Log) => {
    console.group('=== LOG DETAILS BUTTON CLICKED ===');
    console.log('Log object:', log);
    console.log('Log ID:', log.id);
    console.log('Log action:', log.action);
    console.log('Log entity_type:', log.entity_type);
    console.log('Log entity_id:', log.entity_id);
    console.log('Log details:', log.details);
    console.log('Log created_at:', log.created_at);
    console.log('Log user_id:', log.user_id);
    console.log('User from map:', usersMap.get(log.user_id));
    console.log('Current selected log:', selectedLog);
    console.log('Current modal state:', isDetailsModalOpen);
    
    try {
      if (!log) {
        console.error('No log data provided to handleShowDetails');
        console.groupEnd();
        return;
      }
      
      if (!log.action) {
        console.error('Log missing action, cannot show details:', log);
        console.groupEnd();
        return;
      }
      
      if (!log.id) {
        console.warn('Log missing ID, but attempting to show details anyway:', log);
      }
      
      console.log('Setting selected log...');
      setSelectedLog(log);
      console.log('Opening details modal...');
      setIsDetailsModalOpen(true);
      console.log('Modal operations completed');
      
    } catch (error) {
      console.error('Error in handleShowDetails:', error);
    }
    
    console.groupEnd();
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    // Delay clearing the selected log to allow modal to close smoothly
    setTimeout(() => {
      setSelectedLog(null);
    }, 150);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return Plus;
      case 'UPDATE':
        return Edit;
      case 'DELETE':
        return Trash2;
      case 'LOGIN':
        return LogIn;
      case 'VIEW':
        return Eye;
      case 'EMERGENCY_STATUS_CHANGE':
        return ShieldAlert;
      case 'VIEW_LIST':
        return List;
      case 'VIEW_EMERGENCY_LIST':
        return ShieldCheck;
      case 'TOKEN_CHECK':
        return Key;
      default:
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-400';
      case 'UPDATE':
        return 'text-primary-400'; // ✨ НОВЫЙ цвет
      case 'DELETE':
        return 'text-red-400';
      case 'LOGIN':
        return 'text-accent-400'; // ✨ НОВЫЙ цвет
      case 'VIEW':
        return 'text-gray-400';
      case 'EMERGENCY_STATUS_CHANGE':
        return 'text-red-500';
      case 'VIEW_LIST':
        return 'text-secondary-400'; // ✨ НОВЫЙ цвет
      case 'VIEW_EMERGENCY_LIST':
        return 'text-orange-400';
      case 'TOKEN_CHECK':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  const getTargetInfo = (log: Log) => {
    if (!log.details) return null;

    switch (log.entity_type) {
      case 'passport':
        if (log.details.first_name && log.details.last_name) {
          return {
            title: `${log.details.first_name} ${log.details.last_name}`,
            subtitle: log.details.nickname || `Discord: ${log.details.discord_id}`,
            type: 'Паспорт'
          };
        }
        return { title: 'Паспорт', subtitle: `ID: ${log.entity_id}`, type: 'Паспорт' };
      
      case 'fine':
        if (log.details.passport_info) {
          return {
            title: `${log.details.passport_info.first_name} ${log.details.passport_info.last_name}`,
            subtitle: `${log.details.article} - ${log.details.amount} АР`,
            type: 'Штраф'
          };
        }
        return { 
          title: log.details.article || 'Штраф', 
          subtitle: log.details.amount ? `${log.details.amount} АР` : `ID: ${log.entity_id}`,
          type: 'Штраф'
        };
      
      case 'payment':
        return {
          title: log.details.payer_nickname || 'Платеж',
          subtitle: log.details.total_amount ? `${log.details.total_amount} АР` : `ID: ${log.entity_id}`,
          type: 'Платеж'
        };
      
      case 'user':
        return {
          title: log.details.discord_username || 'Пользователь',
          subtitle: log.details.role || `ID: ${log.entity_id}`,
          type: 'Пользователь'
        };
      
      default:
        return {
          title: log.entity_type,
          subtitle: `ID: ${log.entity_id}`,
          type: log.entity_type
        };
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'passport':
        return User;
      case 'fine':
        return AlertTriangle;
      case 'user':
        return User;
      case 'emergency':
        return ShieldAlert;
      default:
        return FileText;
    }
  };

  const getEntityName = (entityType: string) => {
    switch (entityType) {
      case 'passport':
        return 'Паспорт';
      case 'fine':
        return 'Штраф';
      case 'user':
        return 'Пользователь';
      case 'emergency':
        return 'ЧС статус';
      default:
        return entityType;
    }
  };

  const getActionName = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Создание';
      case 'UPDATE':
        return 'Обновление';
      case 'DELETE':
        return 'Удаление';
      case 'LOGIN':
        return 'Вход';
      case 'VIEW':
        return 'Просмотр';
      case 'EMERGENCY_STATUS_CHANGE':
        return 'Изменение ЧС';
      case 'VIEW_LIST':
        return 'Просмотр списка';
      case 'VIEW_EMERGENCY_LIST':
        return 'Просмотр ЧС списка';
      case 'TOKEN_CHECK':
        return 'Проверка токена';
      default:
        return action;
    }
  };

  const columns = [
    {
      key: 'action',
      label: 'Действие',
      width: '180px',
      render: (action: string) => {
        const Icon = getActionIcon(action);
        return (
          <div className="flex items-center space-x-2">
            <Icon className={`h-4 w-4 ${getActionColor(action)}`} />
            <span className={`text-sm font-medium ${getActionColor(action)} truncate`}>
              {getActionName(action)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'entity_type',
      label: 'Объект',
      width: '120px',
      render: (entityType: string) => {
        const Icon = getEntityIcon(entityType);
        return (
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">
              {getEntityName(entityType)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'user_id',
      label: 'Пользователь',
      width: '180px',
      render: (userId: number) => {
        const user = usersMap.get(userId);
        if (!user || !user.discord_username) return <span className="text-gray-500">Неизвестен</span>;

        return (
          <div className="flex items-center space-x-3">
            <UserAvatar user={user} size={28} showStatus />
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{user.discord_username}</p>
              <p className="text-xs text-gray-400">
                {user.role === 'admin' ? 'Администратор' : user.role === 'police' ? 'Полицейский' : 'Житель'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'target_info',
      label: 'Целевой элемент',
      width: '200px',
      render: (_: any, log: Log) => {
        const targetInfo = getTargetInfo(log);
        if (!targetInfo) return <span className="text-gray-500">—</span>;

        return (
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{targetInfo.title}</p>
            <p className="text-xs text-gray-400 truncate">{targetInfo.subtitle}</p>
          </div>
        );
      },
    },
    {
      key: 'ip_address',
      label: 'IP адрес',
      width: '140px',
      render: (ipAddress: string) => (
        <span className="text-sm text-gray-400 font-mono">
          {ipAddress || '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Время',
      width: '160px',
      render: (date: string) => (
        <div className="text-sm">
          <p className="text-gray-300">{formatDate(date, 'dd.MM.yyyy')}</p>
          <p className="text-gray-500 text-xs">{formatDate(date, 'HH:mm:ss')}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      width: '100px',
      render: (_: any, log: Log) => {
        // Не показываем кнопку для просмотра списков и других нежелательных действий
        const hideButtonActions = ['VIEW_LIST', 'VIEW_EMERGENCY_LIST', 'VIEW_STATISTICS'];
        
        if (hideButtonActions.includes(log.action)) {
          return <span className="text-gray-500 text-xs">—</span>;
        }
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              try {
                e.preventDefault();
                e.stopPropagation();
                handleShowDetails(log);
              } catch (error) {
                console.error('Error in button onClick:', error);
              }
            }}
            leftIcon={<Eye className="h-3 w-3" />}
            className="text-xs hover:bg-primary-500/10"
            type="button"
          >
            Подробнее
          </Button>
        );
      },
    },
  ];

  // Обновленный список фильтров действий
  const actionFilter = [
    { value: '', label: 'Все действия' },
    { value: 'CREATE', label: 'Создание' },
    { value: 'UPDATE', label: 'Обновление' },
    { value: 'DELETE', label: 'Удаление' },
    { value: 'LOGIN', label: 'Вход' },
    { value: 'VIEW', label: 'Просмотр' },
    { value: 'EMERGENCY_STATUS_CHANGE', label: 'Изменение ЧС' },
    { value: 'VIEW_LIST', label: 'Просмотр списка' },
    { value: 'VIEW_EMERGENCY_LIST', label: 'Просмотр ЧС списка' },
    { value: 'TOKEN_CHECK', label: 'Проверка токена' },
  ];

  // Исключаем нежелательные события из статистики
  const validLogs = logs?.filter(log => !EXCLUDED_LOG_ACTIONS.includes(log.action as any)) || [];
  
  const uniqueActions = [...new Set(validLogs.map(log => log.action))];
  const totalLogs = validLogs.length;
  const todayLogs = validLogs.filter(log => {
    const today = new Date();
    const logDate = new Date(log.created_at);
    return logDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    {
      title: 'Всего записей',
      value: totalLogs,
      icon: Activity,
      color: 'primary' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'За сегодня',
      value: todayLogs,
      icon: Calendar,
      color: 'success' as const,
    },
    {
      title: 'Пользователей',
      value: usersMap.size,
      icon: User,
      color: 'accent' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'Типов действий',
      value: uniqueActions.length,
      icon: Server,
      color: 'secondary' as const, // ✨ НОВЫЙ цвет
    },
  ];

  const actions = (
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <Input
          placeholder="Поиск..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-64 minecraft-input"
        />
        <div className="flex space-x-2">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="flex-1 sm:w-auto bg-minecraft-dark border border-primary-500/30 text-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none"
          >
            {actionFilter.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setIsFilterModalOpen(true)}
            className="flex-shrink-0"
          >
            <span className="sr-only sm:not-sr-only">Фильтры</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshLogs()}
          leftIcon={<Activity className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          <span className="sm:hidden">Обновить</span>
          <span className="hidden sm:inline">Обновить</span>
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      title="Логи системы"
      subtitle="Журнал действий пользователей"
      actions={actions}
    >
      <div className="space-y-6">
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

        {/* Recent Activity */}
        {validLogs && validLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="minecraft">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary-400" />
                Последние действия
              </h3>
              <div className="space-y-3">
                {validLogs.slice(0, 5).map((log, index) => {
                  const user = usersMap.get(log.user_id);
                  const Icon = getActionIcon(log.action);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center space-x-3 p-3 bg-minecraft-dark/50 rounded-lg minecraft-card"
                    >
                      <Icon className={`h-4 w-4 ${getActionColor(log.action)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          <span className="font-medium">{(user && user.discord_username) || 'Неизвестен'}</span>
                          {' '}
                          <span className={getActionColor(log.action)}>
                            {getActionName(log.action).toLowerCase()}
                          </span>
                          {' '}
                          <span className="text-gray-300">
                            {getEntityName(log.entity_type).toLowerCase()}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Logs Table with Infinite Scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="minecraft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary-400" />
                Все логи ({totalCount})
              </h3>
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Загрузка...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {filteredLogs.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm || selectedAction
                    ? 'Логи не найдены по заданным критериям'
                    : 'Логов пока нет'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary-500/20">
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className="px-4 py-3 text-left text-sm font-medium text-gray-400"
                          style={{ width: column.width }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-500/10">
                    {filteredLogs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-primary-500/5 transition-colors duration-200"
                        style={{ pointerEvents: 'auto' }}
                      >
                        {columns.map((column) => (
                          <td key={column.key} className="px-4 py-4">
                            {column.render ? 
                              column.render(log[column.key as keyof Log], log) : 
                              log[column.key as keyof Log]
                            }
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="flex justify-center py-6">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Загружаем еще логи...</span>
                    </div>
                  </div>
                )}

                {/* No More Data */}
                {!hasMore && filteredLogs.length > 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">Все логи загружены</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        type="logs"
        currentFilters={appliedFilters}
      />

      {/* Log Details Modal */}
      <LogDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        log={selectedLog}
        user={selectedLog ? usersMap.get(selectedLog.user_id) || null : null}
      />
    </Layout>
  );
};

export default Logs;