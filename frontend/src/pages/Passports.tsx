// src/pages/Passports.tsx
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
  ShieldAlert
} from 'lucide-react';
import { Passport } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Modal, Select, Badge } from '@/components/ui';
import { PassportForm } from '@/components/forms';
import { FilterModal, FilterOptions } from '@/components/modals';
import EmergencyModal from '@/components/modals/EmergencyModal';
import { formatDate, getInitials } from '@/utils';

const Passports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState('');
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [passportToDelete, setPassportToDelete] = useState<Passport | null>(null);
  const [passportForEmergency, setPassportForEmergency] = useState<Passport | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({});

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
  }, [selectedCity, emergencyFilter]);

  const loadPassports = () => {
    const emergency_only = emergencyFilter === 'true' ? true : emergencyFilter === 'false' ? false : undefined;
    fetchPassports(0, 100, undefined, selectedCity || undefined, emergency_only);
  };

  const filteredPassports = passports?.filter(passport => {
    // Поиск
    const matchesSearch = passport.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport.nickname.toLowerCase().includes(searchTerm.toLowerCase());

    // Дополнительные фильтры из модального окна
    let matchesFilters = true;

    if (appliedFilters.gender && passport.gender !== appliedFilters.gender) {
      matchesFilters = false;
    }

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

  // ✨ Уникальные города из данных
  const uniqueCities = [...new Set(passports?.map(p => p.city) || [])].sort();

  const cityOptions = [
    { value: '', label: 'Все города' },
    ...uniqueCities.map(city => ({ value: city, label: city }))
  ];

  const emergencyOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'true', label: 'Только в ЧС' },
    { value: 'false', label: 'Только не в ЧС' },
  ];

  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      render: (_: any, passport: Passport) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          passport.is_emergency 
            ? 'bg-gradient-to-br from-red-500 to-red-600'
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
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
          <p className="text-sm text-dark-400">{passport.nickname}</p>
        </div>
      ),
    },
    // ✨ НОВАЯ КОЛОНКА: Город
    {
      key: 'city',
      label: 'Город',
      width: '120px',
      render: (city: string) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-dark-400" />
          <span className="text-dark-300">{city}</span>
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
    // ✨ НОВАЯ КОЛОНКА: Нарушения
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
        <span className="text-dark-400 text-sm">{formatDate(date, 'dd.MM.yyyy')}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      width: '180px',
      render: (_: any, passport: Passport) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPassport(passport)}
            className="!p-2"
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

  // ✨ ОБНОВЛЕННАЯ статистика
  const stats = [
    {
      title: 'Всего паспортов',
      value: passports?.length || 0,
      icon: Users,
      color: 'blue' as const,
    },
    {
      title: 'В списке ЧС',
      value: passports?.filter(p => p.is_emergency).length || 0,
      icon: ShieldAlert,
      color: 'red' as const,
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
        {/* ✨ НОВЫЙ фильтр по городу */}
        <Select
          options={cityOptions}
          value={selectedCity}
          onChange={setSelectedCity}
          className="w-40"
        />
        {/* ✨ НОВЫЙ фильтр по ЧС статусу */}
        <Select
          options={emergencyOptions}
          value={emergencyFilter}
          onChange={setEmergencyFilter}
          className="w-40"
        />
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
              searchTerm || selectedCity || emergencyFilter
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

      {/* ✨ НОВОЕ: Emergency Management Modal */}
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