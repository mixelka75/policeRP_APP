// src/pages/Users.tsx - Обновленная цветовая схема
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  CheckCircle,
  X,
  AlertTriangle,
  Settings,
  ExternalLink,
  Activity,
  Clock
} from 'lucide-react';
import { User } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Modal, Card, Badge } from '@/components/ui';
import { FilterModal, FilterOptions } from '@/components/modals';
import UserAvatar from '@/components/common/UserAvatar';
import {
  getDisplayName,
  getRoleDisplayName,
  getFullUserName,
  isUserDataOutdated,
  formatDate,
  formatRelativeTime
} from '@/utils';

const Users: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'discord' | 'minecraft'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleCheckModalOpen, setIsRoleCheckModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [userToManage, setUserToManage] = useState<User | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({});

  const {
    data: users,
    isLoading,
    execute: fetchUsers,
  } = useApi(apiService.getUsers);

  const {
    data: userStatistics,
    execute: fetchUserStatistics,
  } = useApi(apiService.getUserStatistics);

  const { execute: checkUserRoles, isLoading: isCheckingRoles } = useApi(
    apiService.checkUserRoles,
    {
      showSuccessToast: true,
      successMessage: 'Роли пользователя проверены',
      onSuccess: () => {
        fetchUsers();
        fetchUserStatistics();
        setIsRoleCheckModalOpen(false);
        setUserToManage(null);
      },
    }
  );

  const { execute: activateUser, isLoading: isActivating } = useApi(
    apiService.activateUser,
    {
      showSuccessToast: true,
      successMessage: 'Пользователь активирован',
      onSuccess: () => {
        fetchUsers();
        fetchUserStatistics();
        setIsStatusModalOpen(false);
        setUserToManage(null);
      },
    }
  );

  const { execute: deactivateUser, isLoading: isDeactivating } = useApi(
    apiService.deactivateUser,
    {
      showSuccessToast: true,
      successMessage: 'Пользователь деактивирован',
      onSuccess: () => {
        fetchUsers();
        fetchUserStatistics();
        setIsStatusModalOpen(false);
        setUserToManage(null);
      },
    }
  );

  const { execute: checkAllRoles, isLoading: isCheckingAllRoles } = useApi(
    apiService.checkAllRoles,
    {
      showSuccessToast: true,
      successMessage: 'Массовая проверка ролей запущена',
      onSuccess: () => {
        fetchUsers();
        fetchUserStatistics();
      },
    }
  );

  useEffect(() => {
    fetchUsers();
    fetchUserStatistics();
  }, []);

  const filteredUsers = users?.filter(user => {
    const searchLower = searchTerm.toLowerCase();

    // Search logic
    let matchesSearch = false;
    switch (searchType) {
      case 'discord':
        matchesSearch = user.discord_username.toLowerCase().includes(searchLower);
        break;
      case 'minecraft':
        matchesSearch = user.minecraft_username?.toLowerCase().includes(searchLower) || false;
        break;
      default:
        matchesSearch = (
          user.discord_username.toLowerCase().includes(searchLower) ||
          (user.minecraft_username?.toLowerCase().includes(searchLower) || false)
        );
        break;
    }

    // Filter logic
    let matchesFilters = true;

    // Role filter
    if (appliedFilters.role && user.role !== appliedFilters.role) {
      matchesFilters = false;
    }

    // Active status filter
    if (appliedFilters.isActive) {
      const isActiveFilter = appliedFilters.isActive === 'true';
      if (user.is_active !== isActiveFilter) {
        matchesFilters = false;
      }
    }

    // Date range filter (registration date)
    if (appliedFilters.dateRange?.start) {
      const userDate = new Date(user.created_at);
      const startDate = new Date(appliedFilters.dateRange.start);
      if (userDate < startDate) matchesFilters = false;
    }

    if (appliedFilters.dateRange?.end) {
      const userDate = new Date(user.created_at);
      const endDate = new Date(appliedFilters.dateRange.end);
      if (userDate > endDate) matchesFilters = false;
    }

    return matchesSearch && matchesFilters;
  }) || [];

  const handleCheckRoles = (user: User) => {
    setUserToManage(user);
    setIsRoleCheckModalOpen(true);
  };

  const handleStatusChange = (user: User) => {
    setUserToManage(user);
    setIsStatusModalOpen(true);
  };

  const confirmCheckRoles = async () => {
    if (userToManage) {
      await checkUserRoles(userToManage.id);
    }
  };

  const confirmStatusChange = async () => {
    if (userToManage) {
      if (userToManage.is_active) {
        await deactivateUser(userToManage.id);
      } else {
        await activateUser(userToManage.id);
      }
    }
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setAppliedFilters({});
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-red-400' : 'text-primary-400'; // ✨ НОВЫЙ цвет
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? ShieldCheck : Shield;
  };

  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      render: (_: any, user: User) => (
        <UserAvatar
          user={user}
          size={40}
          showStatus={true}
        />
      ),
    },
    {
      key: 'user_info',
      label: 'Пользователь',
      render: (_: any, user: User) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-white">{getDisplayName(user)}</p>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3 text-secondary-400" />
              <span className={`text-xs ${getRoleColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>{getFullUserName(user)}</span>
            {user.minecraft_username && (
              <>
                <span>•</span>
                <span>{user.minecraft_username}</span>
              </>
            )}
          </div>
          {isUserDataOutdated(user) && (
            <Badge variant="warning" size="sm">
              Устарело
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Статус',
      width: '120px',
      render: (isActive: boolean) => (
        <div className={`flex items-center space-x-2 ${
          isActive ? 'text-green-400' : 'text-red-400'
        }`}>
          {isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isActive ? 'Активен' : 'Заблокирован'}
          </span>
        </div>
      ),
    },
    {
      key: 'last_role_check',
      label: 'Последняя проверка',
      width: '160px',
      render: (date: string) => (
        <div className="text-sm">
          <p className="text-gray-300">{formatDate(date, 'dd.MM.yyyy')}</p>
          <p className="text-gray-500 text-xs">{formatRelativeTime(date)}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Дата создания',
      width: '150px',
      render: (date: string) => (
        <span className="text-gray-400 text-sm">{formatDate(date, 'dd.MM.yyyy')}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      width: '200px',
      render: (_: any, user: User) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCheckRoles(user)}
            className="!p-2 text-primary-400 hover:text-primary-300"
            title="Проверить роли"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusChange(user)}
            className={`!p-2 ${
              user.is_active 
                ? 'text-red-400 hover:text-red-300' 
                : 'text-green-400 hover:text-green-300'
            }`}
            title={user.is_active ? 'Деактивировать' : 'Активировать'}
            disabled={user.id === currentUser?.id}
          >
            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          <a
            href={`https://discord.com/users/${user.discord_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-gray-100 transition-colors"
            title="Открыть профиль в Discord"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ),
    },
  ];

  const stats = [
    {
      title: 'Всего пользователей',
      value: userStatistics?.total_users || 0,
      icon: UsersIcon,
      color: 'primary' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'Активных',
      value: userStatistics?.active_users || 0,
      icon: UserCheck,
      color: 'success' as const,
    },
    {
      title: 'Администраторов',
      value: userStatistics?.admin_users || 0,
      icon: ShieldCheck,
      color: 'danger' as const,
    },
    {
      title: 'Полицейских',
      value: userStatistics?.police_users || 0,
      icon: Shield,
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
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            className="flex-1 sm:w-auto bg-minecraft-dark border border-primary-500/30 text-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none"
          >
            <option value="all">Все</option>
            <option value="discord">Discord</option>
            <option value="minecraft">Minecraft</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setIsFilterModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <span className="sm:hidden">Фильтры</span>
            <span className="hidden sm:inline">Фильтры</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers()}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          <span className="sm:hidden">Обновить</span>
          <span className="hidden sm:inline">Обновить</span>
        </Button>
        <Button
          variant="minecraft"
          size="sm"
          onClick={() => checkAllRoles()}
          loading={isCheckingAllRoles}
          leftIcon={<Activity className="h-4 w-4" />}
          glow
          className="w-full sm:w-auto"
        >
          <span className="sm:hidden">Проверить</span>
          <span className="hidden sm:inline">Проверить все роли</span>
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      title="Пользователи"
      subtitle="Управление пользователями Discord"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="minecraft" className="bg-secondary-500/10 border-secondary-500/20">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6 text-secondary-400" />
              <div>
                <h3 className="text-lg font-semibold text-secondary-400">
                  Discord авторизация
                </h3>
                <p className="text-secondary-300">
                  Пользователи создаются автоматически при первом входе через Discord.
                  Роли определяются на основе ролей в Discord сервере.
                </p>
              </div>
            </div>
          </Card>
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

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Table
            columns={columns}
            data={filteredUsers}
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? `Пользователи не найдены по запросу "${searchTerm}"`
                : 'Пользователи появятся после авторизации через Discord'
            }
          />
        </motion.div>
      </div>

      {/* Role Check Modal */}
      <Modal
        isOpen={isRoleCheckModalOpen}
        onClose={() => setIsRoleCheckModalOpen(false)}
        title="Проверка ролей"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {userToManage && (
              <UserAvatar
                user={userToManage}
                size={40}
              />
            )}
            <div>
              <p className="font-medium text-white">
                {userToManage ? getDisplayName(userToManage) : ''}
              </p>
              <p className="text-sm text-gray-400">
                {userToManage ? getFullUserName(userToManage) : ''}
              </p>
            </div>
          </div>

          <p className="text-gray-300">
            Проверить роли пользователя в Discord и обновить данные в системе?
          </p>

          <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-accent-400" />
              <span className="text-sm text-accent-400">
                Это может изменить роль пользователя в системе
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsRoleCheckModalOpen(false)}
              disabled={isCheckingRoles}
            >
              Отмена
            </Button>
            <Button
              variant="minecraft"
              onClick={confirmCheckRoles}
              loading={isCheckingRoles}
              glow
            >
              Проверить роли
            </Button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        type="users"
        currentFilters={appliedFilters}
      />

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={userToManage?.is_active ? 'Деактивировать пользователя' : 'Активировать пользователя'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {userToManage && (
              <UserAvatar
                user={userToManage}
                size={40}
              />
            )}
            <div>
              <p className="font-medium text-white">
                {userToManage ? getDisplayName(userToManage) : ''}
              </p>
              <p className="text-sm text-gray-400">
                {userToManage ? getFullUserName(userToManage) : ''}
              </p>
            </div>
          </div>

          <p className="text-gray-300">
            {userToManage?.is_active
              ? 'Деактивировать пользователя? Он потеряет доступ к системе.'
              : 'Активировать пользователя? Он получит доступ к системе согласно своей роли.'
            }
          </p>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isActivating || isDeactivating}
            >
              Отмена
            </Button>
            <Button
              variant={userToManage?.is_active ? "danger" : "success"}
              onClick={confirmStatusChange}
              loading={isActivating || isDeactivating}
            >
              {userToManage?.is_active ? 'Деактивировать' : 'Активировать'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Users;