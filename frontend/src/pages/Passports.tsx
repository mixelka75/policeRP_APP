// src/pages/Passports.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Download,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { Passport } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Modal } from '@/components/ui';
import { PassportForm } from '@/components/forms';
import { formatDate, getInitials } from '@/utils';

const Passports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [passportToDelete, setPassportToDelete] = useState<Passport | null>(null);

  const {
    data: passports,
    isLoading,
    execute: fetchPassports,
  } = useApi(apiService.getPassports);

  const { execute: deletePassport, isLoading: isDeleting } = useApi(
    apiService.deletePassport,
    {
      showSuccessToast: true,
      successMessage: 'Паспорт удален успешно',
      onSuccess: () => {
        fetchPassports();
        setIsDeleteModalOpen(false);
        setPassportToDelete(null);
      },
    }
  );

  useEffect(() => {
    fetchPassports();
  }, []);

  const filteredPassports = passports?.filter(passport =>
    passport.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreatePassport = () => {
    setSelectedPassport(null);
    setIsFormOpen(true);
  };

  const handleEditPassport = (passport: Passport) => {
    setSelectedPassport(passport);
    setIsFormOpen(true);
  };

  const handleDeletePassport = (passport: Passport) => {
    setPassportToDelete(passport);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (passportToDelete) {
      await deletePassport(passportToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    fetchPassports();
  };

  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      render: (_: any, passport: Passport) => (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {getInitials(passport.first_name, passport.last_name)}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Имя',
      render: (_: any, passport: Passport) => (
        <div>
          <p className="font-medium text-white">
            {passport.first_name} {passport.last_name}
          </p>
          <p className="text-sm text-dark-400">@{passport.nickname}</p>
        </div>
      ),
    },
    {
      key: 'age',
      label: 'Возраст',
      width: '100px',
      render: (age: number) => (
        <span className="text-blue-400 font-medium">{age} лет</span>
      ),
    },
    {
      key: 'gender',
      label: 'Пол',
      width: '100px',
      render: (gender: string) => (
        <span className="text-dark-300">
          {gender === 'male' ? 'Мужской' : 'Женский'}
        </span>
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
      render: (_: any, passport: Passport) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPassport(passport)}
            className="!p-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePassport(passport)}
            className="!p-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const stats = [
    {
      title: 'Всего паспортов',
      value: passports?.length || 0,
      icon: Users,
      color: 'blue' as const,
    },
    {
      title: 'Мужчин',
      value: passports?.filter(p => p.gender === 'male').length || 0,
      icon: UserPlus,
      color: 'green' as const,
    },
    {
      title: 'Женщин',
      value: passports?.filter(p => p.gender === 'female').length || 0,
      icon: UserPlus,
      color: 'purple' as const,
    },
    {
      title: 'Средний возраст',
      value: passports?.length ? Math.round(passports.reduce((sum, p) => sum + p.age, 0) / passports.length) : 0,
      icon: AlertTriangle,
      color: 'yellow' as const,
    },
  ];

  const actions = (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Поиск по имени, фамилии или никнейму..."
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
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
        >
          Экспорт
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreatePassport}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Создать паспорт
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      title="Паспорта"
      subtitle="Управление паспортами жителей"
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
            data={filteredPassports}
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? `Паспорта не найдены по запросу "${searchTerm}"`
                : 'Паспортов пока нет. Создайте первый паспорт.'
            }
          />
        </motion.div>
      </div>

      {/* Passport Form Modal */}
      <PassportForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        passport={selectedPassport}
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
            Вы уверены, что хотите удалить паспорт пользователя{' '}
            <span className="font-medium text-white">
              {passportToDelete?.first_name} {passportToDelete?.last_name}
            </span>
            ?
          </p>
          <p className="text-sm text-red-400">
            Это действие нельзя отменить. Все связанные штрафы также будут удалены.
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

export default Passports;