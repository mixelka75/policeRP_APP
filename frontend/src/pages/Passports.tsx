// src/pages/Passports.tsx - Обновленная цветовая схема
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  UserPlus,
  AlertTriangle,
  MapPin,
  Shield,
  ShieldAlert,
  ScrollText,
  Receipt
} from 'lucide-react';
import { Passport } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Modal, Badge } from '@/components/ui';
import { PassportForm } from '@/components/forms';
import { FilterModal, FilterOptions } from '@/components/modals';
import EmergencyModal from '@/components/modals/EmergencyModal';
import PassportLogsModal from '@/components/modals/PassportLogsModal';
import PassportFinesModal from '@/components/modals/PassportFinesModal';
import { formatDate, getInitials } from '@/utils';
import { PlayerSkin, MinecraftHead } from '@/components/common';

const Passports: React.FC = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [passportToDelete, setPassportToDelete] = useState<Passport | null>(null);
  const [passportForEmergency, setPassportForEmergency] = useState<Passport | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({});
  const [isPassportLogsModalOpen, setIsPassportLogsModalOpen] = useState(false);
  const [passportForLogs, setPassportForLogs] = useState<Passport | null>(null);
  const [isPassportFinesModalOpen, setIsPassportFinesModalOpen] = useState(false);
  const [passportForFines, setPassportForFines] = useState<Passport | null>(null);

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
    loadPassports();
  }, []);

  const loadPassports = () => {
    fetchPassports(0, 100, undefined, undefined, undefined);
  };

  const filteredPassports = passports?.filter(passport => {
    // Поиск
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${passport.first_name} ${passport.last_name}`.toLowerCase();
    const matchesSearch = 
      passport.first_name.toLowerCase().includes(searchLower) ||
      passport.last_name.toLowerCase().includes(searchLower) ||
      fullName.includes(searchLower) ||
      (passport.nickname && passport.nickname.toLowerCase().includes(searchLower)) ||
      passport.discord_id.includes(searchTerm);

    // Дополнительные фильтры из модального окна
    let matchesFilters = true;

    // Gender filter
    if (appliedFilters.gender && passport.gender !== appliedFilters.gender) {
      matchesFilters = false;
    }

    // City filter
    if (appliedFilters.city && !passport.city.toLowerCase().includes(appliedFilters.city.toLowerCase())) {
      matchesFilters = false;
    }

    // Age range filter
    if (appliedFilters.age?.min && passport.age < appliedFilters.age.min) {
      matchesFilters = false;
    }
    if (appliedFilters.age?.max && passport.age > appliedFilters.age.max) {
      matchesFilters = false;
    }

    // Emergency status filter
    if (appliedFilters.isEmergency) {
      const isEmergencyFilter = appliedFilters.isEmergency === 'true';
      if (passport.is_emergency !== isEmergencyFilter) {
        matchesFilters = false;
      }
    }

    // Violations count filter
    if (appliedFilters.violationsCount?.min && passport.violations_count < appliedFilters.violationsCount.min) {
      matchesFilters = false;
    }
    if (appliedFilters.violationsCount?.max && passport.violations_count > appliedFilters.violationsCount.max) {
      matchesFilters = false;
    }

    // Date range filter
    if (appliedFilters.dateRange?.start) {
      const passportDate = new Date(passport.created_at);
      const startDate = new Date(appliedFilters.dateRange.start);
      if (passportDate < startDate) matchesFilters = false;
    }

    if (appliedFilters.dateRange?.end) {
      const passportDate = new Date(passport.created_at);
      const endDate = new Date(appliedFilters.dateRange.end);
      if (passportDate > endDate) matchesFilters = false;
    }

    return matchesSearch && matchesFilters;
  }) || [];

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

  const handleEmergencyAction = (passport: Passport) => {
    setPassportForEmergency(passport);
    setIsEmergencyModalOpen(true);
  };

  const handleShowPassportLogs = (passport: Passport) => {
    setPassportForLogs(passport);
    setIsPassportLogsModalOpen(true);
  };

  const handleShowPassportFines = (passport: Passport) => {
    setPassportForFines(passport);
    setIsPassportFinesModalOpen(true);
  };

  const confirmDelete = async () => {
    if (passportToDelete) {
      await deletePassport(passportToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    loadPassports();
  };

  const handleEmergencySuccess = () => {
    loadPassports();
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setAppliedFilters({});
  };


  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      render: (_: any, passport: Passport) => (
        <div className={`relative ${
          passport.is_emergency 
            ? 'ring-2 ring-red-500 shadow-red-500/30'
            : 'ring-2 ring-primary-500 shadow-primary-glow'
        } rounded-lg animate-glow`}>
          <MinecraftHead
            discordId={passport.discord_id}
            passportId={passport.id}
            size="lg"
            className="rounded-lg"
          />
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Имя',
      render: (_: any, passport: Passport) => (
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium text-white">
              {passport.first_name} {passport.last_name}
            </p>
            {passport.is_emergency && (
              <Badge variant="danger" size="sm">
                ЧС
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {passport.nickname || `Discord: ${passport.discord_id}`}
          </p>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Город',
      width: '120px',
      render: (city: string) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-primary-400" />
          <span className="text-primary-300">{city}</span>
        </div>
      ),
    },
    {
      key: 'age',
      label: 'Возраст',
      width: '100px',
      render: (age: number) => (
        <span className="text-secondary-400 font-medium">{age} лет</span>
      ),
    },
    {
      key: 'gender',
      label: 'Пол',
      width: '100px',
      render: (gender: string) => (
        <span className="text-gray-300">
          {gender === 'male' ? 'Мужской' : 'Женский'}
        </span>
      ),
    },
    {
      key: 'violations_count',
      label: 'Нарушения',
      width: '100px',
      render: (count: number) => (
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`h-4 w-4 ${count > 0 ? 'text-red-400' : 'text-green-400'}`} />
          <span className={`font-medium ${count > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {count}
          </span>
        </div>
      ),
    },
    {
      key: 'entry_date',
      label: 'Въезд в город',
      width: '130px',
      render: (date: string) => (
        <span className="text-gray-400 text-sm">{formatDate(date, 'dd.MM.yyyy')}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      width: '260px',
      render: (_: any, passport: Passport) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPassport(passport)}
            className="!p-2 text-primary-400 hover:text-primary-300"
            title="Редактировать"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEmergencyAction(passport)}
            className={`!p-2 ${
              passport.is_emergency 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-red-400 hover:text-red-300'
            }`}
            title={passport.is_emergency ? 'Убрать из ЧС' : 'Добавить в ЧС'}
          >
            {passport.is_emergency ? <Shield className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowPassportFines(passport)}
            className="!p-2 text-accent-400 hover:text-accent-300"
            title="Показать штрафы паспорта"
          >
            <Receipt className="h-4 w-4" />
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowPassportLogs(passport)}
              className="!p-2 text-secondary-400 hover:text-secondary-300"
              title="Показать логи паспорта"
            >
              <ScrollText className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePassport(passport)}
            className="!p-2 text-red-400 hover:text-red-300"
            title="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Обновленная статистика с новыми цветами
  const stats = [
    {
      title: 'Всего паспортов',
      value: passports?.length || 0,
      icon: Users,
      color: 'primary' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'В списке ЧС',
      value: passports?.filter(p => p.is_emergency).length || 0,
      icon: ShieldAlert,
      color: 'danger' as const,
    },
    {
      title: 'Мужчин',
      value: passports?.filter(p => p.gender === 'male').length || 0,
      icon: UserPlus,
      color: 'secondary' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'Женщин',
      value: passports?.filter(p => p.gender === 'female').length || 0,
      icon: UserPlus,
      color: 'accent' as const, // ✨ НОВЫЙ цвет
    },
  ];

  const actions = (
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <Input
          placeholder="Поиск по имени, фамилии, нику или Discord ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-64 minecraft-input"
        />
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
      <div className="flex items-center space-x-2">
        <Button
          variant="minecraft"
          size="sm"
          onClick={handleCreatePassport}
          leftIcon={<Plus className="h-4 w-4" />}
          glow
          className="w-full sm:w-auto"
        >
          <span className="sm:hidden">Паспорт</span>
          <span className="hidden sm:inline">Создать паспорт</span>
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
                ? 'Паспорта не найдены по заданным критериям'
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

      {/* Emergency Management Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        passport={passportForEmergency}
        onSuccess={handleEmergencySuccess}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        type="passports"
        currentFilters={appliedFilters}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Подтвердите удаление"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
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

      {/* Passport Logs Modal */}
      <PassportLogsModal
        isOpen={isPassportLogsModalOpen}
        onClose={() => setIsPassportLogsModalOpen(false)}
        passport={passportForLogs}
      />

      {/* Passport Fines Modal */}
      <PassportFinesModal
        isOpen={isPassportFinesModalOpen}
        onClose={() => setIsPassportFinesModalOpen(false)}
        passport={passportForFines}
      />
    </Layout>
  );
};

export default Passports;