// src/pages/Fines.tsx - Обновленная цветовая схема
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Fine, Passport } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Modal } from '@/components/ui';
import { FineForm } from '@/components/forms';
import { FilterModal, FilterOptions } from '@/components/modals';
import { formatDate, formatMoney, getInitials } from '@/utils';
import MinecraftAvatar from '@/components/common/MinecraftAvatar';

const Fines: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fineToDelete, setFineToDelete] = useState<Fine | null>(null);
  const [passportMap, setPassportMap] = useState<Map<number, Passport>>(new Map());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({});

  const {
    data: fines,
    isLoading,
    execute: fetchFines,
  } = useApi(apiService.getFines);

  const { execute: fetchPassports } = useApi(apiService.getPassports);

  const { execute: deleteFine, isLoading: isDeleting } = useApi(
    apiService.deleteFine,
    {
      showSuccessToast: true,
      successMessage: 'Штраф удален успешно',
      onSuccess: () => {
        fetchFines();
        setIsDeleteModalOpen(false);
        setFineToDelete(null);
      },
    }
  );

  useEffect(() => {
    fetchFines();
    loadPassports();
  }, []);

  const loadPassports = async () => {
    try {
      const passports = await fetchPassports();
      const map = new Map();
      passports.forEach((passport: Passport) => {
        map.set(passport.id, passport);
      });
      setPassportMap(map);
    } catch (error) {
      console.error('Failed to load passports:', error);
    }
  };

  const filteredFines = fines?.filter(fine => {
    // Поиск
    const passport = passportMap.get(fine.passport_id);
    const matchesSearch = fine.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport?.nickname.toLowerCase().includes(searchTerm.toLowerCase());

    // Фильтры
    let matchesFilters = true;

    if (appliedFilters.amount?.min && fine.amount < appliedFilters.amount.min) {
      matchesFilters = false;
    }

    if (appliedFilters.amount?.max && fine.amount > appliedFilters.amount.max) {
      matchesFilters = false;
    }

    if (appliedFilters.dateRange?.start) {
      const fineDate = new Date(fine.created_at);
      const startDate = new Date(appliedFilters.dateRange.start);
      if (fineDate < startDate) matchesFilters = false;
    }

    if (appliedFilters.dateRange?.end) {
      const fineDate = new Date(fine.created_at);
      const endDate = new Date(appliedFilters.dateRange.end);
      if (fineDate > endDate) matchesFilters = false;
    }

    return matchesSearch && matchesFilters;
  }) || [];

  const handleCreateFine = () => {
    setSelectedFine(null);
    setIsFormOpen(true);
  };

  const handleEditFine = (fine: Fine) => {
    setSelectedFine(fine);
    setIsFormOpen(true);
  };

  const handleDeleteFine = (fine: Fine) => {
    setFineToDelete(fine);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (fineToDelete) {
      await deleteFine(fineToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    fetchFines();
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setAppliedFilters({});
  };

  const columns = [
    {
      key: 'citizen',
      label: 'Гражданин',
      render: (_: any, fine: Fine) => {
        const passport = passportMap.get(fine.passport_id);
        if (!passport) return <span className="text-gray-500">Неизвестен</span>;

        return (
          <div className="flex items-center space-x-3">
            <MinecraftAvatar
              nickname={passport.nickname}
              size={40}
              shape="square"
            />
            <div>
              <p className="font-medium text-white">
                {passport.first_name} {passport.last_name}
              </p>
              <p className="text-sm text-gray-400">{passport.nickname}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'article',
      label: 'Статья',
      render: (article: string) => (
        <div className="max-w-xs">
          <p className="font-medium text-white truncate">{article}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Сумма',
      width: '120px',
      render: (amount: number) => (
        <span className="text-red-400 font-bold text-lg">
          {formatMoney(amount)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Дата выписки',
      width: '150px',
      render: (date: string) => (
        <span className="text-gray-400">{formatDate(date)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      width: '150px',
      render: (_: any, fine: Fine) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditFine(fine)}
            className="!p-2 text-primary-400 hover:text-primary-300"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteFine(fine)}
            className="!p-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const totalAmount = fines?.reduce((sum, fine) => sum + fine.amount, 0) || 0;
  const avgAmount = fines?.length ? Math.round(totalAmount / fines.length) : 0;

  const stats = [
    {
      title: 'Всего штрафов',
      value: fines?.length || 0,
      icon: FileText,
      color: 'primary' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'Общая сумма',
      value: formatMoney(totalAmount),
      icon: DollarSign,
      color: 'danger' as const,
    },
    {
      title: 'Средний штраф',
      value: formatMoney(avgAmount),
      icon: TrendingUp,
      color: 'accent' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'За сегодня',
      value: fines?.filter(fine => {
        const today = new Date();
        const fineDate = new Date(fine.created_at);
        return fineDate.toDateString() === today.toDateString();
      }).length || 0,
      icon: AlertTriangle,
      color: 'secondary' as const, // ✨ НОВЫЙ цвет
    },
  ];

  const actions = (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Поиск по статье или гражданину..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full max-w-80 minecraft-input"
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
          variant="minecraft"
          size="sm"
          onClick={handleCreateFine}
          leftIcon={<Plus className="h-4 w-4" />}
          glow
        >
          Выписать штраф
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      title="Штрафы"
      subtitle="Управление штрафами граждан"
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
            data={filteredFines}
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? `Штрафы не найдены по запросу "${searchTerm}"`
                : 'Штрафов пока нет. Выпишите первый штраф.'
            }
          />
        </motion.div>
      </div>

      {/* Fine Form Modal */}
      <FineForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        fine={selectedFine}
        onSuccess={handleFormSuccess}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        type="fines"
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
            Вы уверены, что хотите удалить штраф{' '}
            <span className="font-medium text-white">
              "{fineToDelete?.article}"
            </span>
            {' '}на сумму{' '}
            <span className="font-medium text-red-400">
              {fineToDelete && formatMoney(fineToDelete.amount)}
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

export default Fines;