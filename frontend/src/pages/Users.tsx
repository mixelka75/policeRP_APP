// src/pages/Users.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { User } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Modal } from '@/components/ui';
import { UserForm } from '@/components/forms';
import { formatDate } from '@/utils';

const Users: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const {
    data: users,
    isLoading,
    execute: fetchUsers,
  } = useApi(apiService.getUsers);

  const { execute: deleteUser, isLoading: isDeleting } = useApi(
    apiService.deleteUser,
    {
      showSuccessToast: true,
      successMessage: 'Пользователь удален успешно',
      onSuccess: () => {
        fetchUsers();
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      },
    }
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users?.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    fetchUsers();
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-red-400' : 'text-blue-400';
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
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          user.role === 'admin' 
            ? 'bg-gradient-to-br from-red-500 to-red-600'
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          <span className="text-white font-medium text-sm">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      key: 'username',
      label: 'Пользователь',
      render: (username: string, user: User) => (
        <div className="flex items-center space-x-3">
          <div>
            <p className="font-medium text-white">{username}</p>
            <div className="flex items-center space-x-2">
              <span className={`text-sm capitalize ${getRoleColor(user.role)}`}>
                {user.role === 'admin' ? 'Администратор' : 'Полицейский'}
              </span>
              {React.createElement(getRoleIcon(user.role), {
                className: `h-4 w-4 ${getRoleColor(user.role)}`
              })}
            </div>
          </div>
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
      key: 'created_at',
      label: 'Дата создания',
      width: '150px',
      render: (date: string) => (
        <span className="text-dark-400">{formatDate(date)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      width: '150px',
      render: (_: any, user: User) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(user)}
            className="!p-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(user)}
            className="!p-2 text-red-400 hover:text-red-300"
            disabled={user.id === currentUser?.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const stats = [
    {
      title: 'Всего пользователей',
      value: users?.length || 0,
      icon: UsersIcon,
      color: 'blue' as const,
    },
    {
      title: 'Администраторов',
      value: users?.filter(u => u.role === 'admin').length || 0,
      icon: ShieldCheck,
      color: 'red' as const,
    },
    {
      title: 'Полицейских',
      value: users?.filter(u => u.role === 'police').length || 0,
      icon: Shield,
      color: 'green' as const,
    },
    {
      title: 'Активных',
      value: users?.filter(u => u.is_active).length || 0,
      icon: UserCheck,
      color: 'yellow' as const,
    },
  ];

  const actions = (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Поиск по имени пользователя..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-80"
        />
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Filter className="h-4 w-4" />}
        >
          Фильтры
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreateUser}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Создать пользователя
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      title="Пользователи"
      subtitle="Управление пользователями системы"
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
                : 'Пользователей пока нет. Создайте первого пользователя.'
            }
          />
        </motion.div>
      </div>

      {/* User Form Modal */}
      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={selectedUser}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Подтвердите удаление"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-dark-300">
            Вы уверены, что хотите удалить пользователя{' '}
            <span className="font-medium text-white">
              {userToDelete?.username}
            </span>
            ?
          </p>
          <p className="text-sm text-red-400">
            Это действие нельзя отменить.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={isDeleting}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Users;