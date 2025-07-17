// src/pages/Logs.tsx
import React, { useState, useEffect } from 'react';
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
  List
} from 'lucide-react';
import { Log, User as UserType } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Card } from '@/components/ui';
import { FilterModal, FilterOptions } from '@/components/modals';
import { formatDate, formatRelativeTime } from '@/utils';

const Logs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [usersMap, setUsersMap] = useState<Map<number, UserType>>(new Map());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({});

  const {
    data: logs,
    isLoading,
    execute: fetchLogs,
  } = useApi(apiService.getLogs);

  const { execute: fetchUsers } = useApi(apiService.getUsers);

  useEffect(() => {
    fetchLogs();
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

    // Поиск
    const matchesSearch = !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.discord_username && user.discord_username.toLowerCase().includes(searchTerm.toLowerCase()));

    // ✨ ИСПРАВЛЕННЫЙ фильтр по действию
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
      case 'EMERGENCY_STATUS_CHANGE':  // ✨ НОВЫЙ тип лога
        return ShieldAlert;
      case 'VIEW_LIST':  // ✨ НОВЫЙ тип лога
        return List;
      default:
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-400';
      case 'UPDATE':
        return 'text-blue-400';
      case 'DELETE':
        return 'text-red-400';
      case 'LOGIN':
        return 'text-purple-400';
      case 'VIEW':
        return 'text-gray-400';
      case 'EMERGENCY_STATUS_CHANGE':  // ✨ НОВЫЙ тип лога
        return 'text-red-500';
      case 'VIEW_LIST':  // ✨ НОВЫЙ тип лога
        return 'text-blue-300';
      default:
        return 'text-dark-300';
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
      case 'emergency':  // ✨ НОВЫЙ тип сущности
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
      case 'emergency':  // ✨ НОВЫЙ тип сущности
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
      case 'EMERGENCY_STATUS_CHANGE':  // ✨ НОВЫЙ тип лога
        return 'Изменение ЧС';
      case 'VIEW_LIST':  // ✨ НОВЫЙ тип лога
        return 'Просмотр списка';
      default:
        return action;
    }
  };

  const columns = [
    {
      key: 'action',
      label: 'Действие',
      width: '180px',  // ✨ Увеличили ширину для длинных названий
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
            <Icon className="h-4 w-4 text-dark-400" />
            <span className="text-sm text-dark-300">
              {getEntityName(entityType)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'user_id',
      label: 'Пользователь',
      render: (userId: number) => {
        const user = usersMap.get(userId);
        if (!user || !user.discord_username) return <span className="text-dark-500">Неизвестен</span>;

        return (
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              user.role === 'admin' 
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {user.discord_username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-dark-100">{user.discord_username}</span>
          </div>
        );
      },
    },
    {
      key: 'details',
      label: 'Детали',
      render: (details: any) => {
        if (!details) return <span className="text-dark-500">—</span>;

        return (
          <div className="max-w-xs">
            <p className="text-sm text-dark-300 truncate">
              {details.username || details.nickname || details.article || details.reason || 'Детали доступны'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'ip_address',
      label: 'IP адрес',
      width: '140px',
      render: (ipAddress: string) => (
        <span className="text-sm text-dark-400 font-mono">
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
          <p className="text-dark-300">{formatDate(date, 'dd.MM.yyyy')}</p>
          <p className="text-dark-500 text-xs">{formatDate(date, 'HH:mm:ss')}</p>
        </div>
      ),
    },
  ];

  // ✨ ОБНОВЛЕННЫЙ список фильтров действий - теперь включает все типы
  const actionFilter = [
    { value: '', label: 'Все действия' },
    { value: 'CREATE', label: 'Создание' },
    { value: 'UPDATE', label: 'Обновление' },
    { value: 'DELETE', label: 'Удаление' },
    { value: 'LOGIN', label: 'Вход' },
    { value: 'VIEW', label: 'Просмотр' },
    { value: 'EMERGENCY_STATUS_CHANGE', label: 'Изменение ЧС' },  // ✨ НОВЫЙ
    { value: 'VIEW_LIST', label: 'Просмотр списка' },  // ✨ НОВЫЙ
  ];

  const uniqueActions = [...new Set(logs?.map(log => log.action) || [])];
  const totalLogs = logs?.length || 0;
  const todayLogs = logs?.filter(log => {
    const today = new Date();
    const logDate = new Date(log.created_at);
    return logDate.toDateString() === today.toDateString();
  }).length || 0;

  const stats = [
    {
      title: 'Всего записей',
      value: totalLogs,
      icon: Activity,
      color: 'blue' as const,
    },
    {
      title: 'За сегодня',
      value: todayLogs,
      icon: Calendar,
      color: 'green' as const,
    },
    {
      title: 'Пользователей',
      value: usersMap.size,
      icon: User,
      color: 'purple' as const,
    },
    {
      title: 'Типов действий',
      value: uniqueActions.length,
      icon: Server,
      color: 'yellow' as const,
    },
  ];

  const actions = (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Поиск по действию, объекту или пользователю..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-80"
        />
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-dark-800 border border-dark-600 text-dark-100 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none"
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
        >
          Фильтры
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs()}
          leftIcon={<Activity className="h-4 w-4" />}
        >
          Обновить
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
        {logs && logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Последние действия
              </h3>
              <div className="space-y-3">
                {logs.slice(0, 5).map((log, index) => {
                  const user = usersMap.get(log.user_id);
                  const Icon = getActionIcon(log.action);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center space-x-3 p-3 bg-dark-700/50 rounded-lg"
                    >
                      <Icon className={`h-4 w-4 ${getActionColor(log.action)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dark-100">
                          <span className="font-medium">{(user && user.discord_username) || 'Неизвестен'}</span>
                          {' '}
                          <span className={getActionColor(log.action)}>
                            {getActionName(log.action).toLowerCase()}
                          </span>
                          {' '}
                          <span className="text-dark-300">
                            {getEntityName(log.entity_type).toLowerCase()}
                          </span>
                        </p>
                        <p className="text-xs text-dark-400">
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

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Table
            columns={columns}
            data={filteredLogs}
            isLoading={isLoading}
            emptyMessage={
              searchTerm || selectedAction
                ? 'Логи не найдены по заданным критериям'
                : 'Логов пока нет'
            }
          />
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
    </Layout>
  );
};

export default Logs;