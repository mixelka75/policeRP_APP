// src/components/modals/PassportLogFilters.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  Calendar, 
  Activity, 
  User as UserIcon, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { User } from '@/types';

export interface PassportLogFilterOptions {
  search?: string;
  actionType?: string;
  entityType?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  userId?: number;
}

interface PassportLogFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
  onApply: (filters: PassportLogFilterOptions) => void;
  onReset: () => void;
  currentFilters: PassportLogFilterOptions;
  users: Map<number, User>;
  activeFilterCount: number;
}

const PassportLogFilters: React.FC<PassportLogFiltersProps> = ({
  isOpen,
  onToggle,
  onApply,
  onReset,
  currentFilters,
  users,
  activeFilterCount
}) => {
  const [filters, setFilters] = useState<PassportLogFilterOptions>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    const resetFilters: PassportLogFilterOptions = {
      search: '',
      actionType: '',
      entityType: '',
      dateRange: {},
      userId: undefined
    };
    setFilters(resetFilters);
    onReset();
  };

  const handleChange = (field: string, value: any) => {
    setFilters(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof PassportLogFilterOptions] as any),
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Action type options
  const actionTypeOptions = [
    { value: '', label: 'Все действия' },
    { value: 'CREATE', label: 'Создание' },
    { value: 'UPDATE', label: 'Обновление' },
    { value: 'DELETE', label: 'Удаление' },
    { value: 'VIEW', label: 'Просмотр' },
    { value: 'EMERGENCY_STATUS_CHANGE', label: 'Изменение ЧС' },
    { value: 'FINE_PAYMENT', label: 'Оплата штрафа' },
    { value: 'LOGIN', label: 'Вход' },
    { value: 'TOKEN_CHECK', label: 'Проверка токена' },
  ];

  // Entity type options
  const entityTypeOptions = [
    { value: '', label: 'Все типы' },
    { value: 'passport', label: 'Паспорт' },
    { value: 'fine', label: 'Штраф' },
    { value: 'payment', label: 'Платеж' },
    { value: 'user', label: 'Пользователь' },
  ];

  // User options
  const userOptions = [
    { value: '', label: 'Все пользователи' },
    ...Array.from(users.values()).map(user => ({
      value: user.id.toString(),
      label: user.discord_username
    }))
  ];

  const getActiveFilters = () => {
    const active = [];
    if (filters.search) active.push(`Поиск: "${filters.search}"`);
    if (filters.actionType) {
      const actionOption = actionTypeOptions.find(opt => opt.value === filters.actionType);
      active.push(`Действие: ${actionOption?.label}`);
    }
    if (filters.entityType) {
      const entityOption = entityTypeOptions.find(opt => opt.value === filters.entityType);
      active.push(`Тип: ${entityOption?.label}`);
    }
    if (filters.dateRange?.start) active.push(`От: ${filters.dateRange.start}`);
    if (filters.dateRange?.end) active.push(`До: ${filters.dateRange.end}`);
    if (filters.userId) {
      const user = users.get(filters.userId);
      active.push(`Пользователь: ${user?.discord_username}`);
    }
    return active;
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          leftIcon={<Filter className="h-4 w-4" />}
          rightIcon={isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          className="relative"
        >
          Фильтры
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-4 w-4" />}
            className="text-gray-400 hover:text-gray-300"
          >
            Сбросить
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50 space-y-4"
          >
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Поиск в деталях
              </label>
              <Input
                placeholder="Поиск по деталям логов, описаниям..."
                value={filters.search || ''}
                onChange={(e) => handleChange('search', e.target.value)}
                fullWidth
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Action Type Filter */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <Activity className="h-4 w-4 inline mr-1" />
                  Тип действия
                </label>
                <Select
                  options={actionTypeOptions}
                  value={filters.actionType || ''}
                  onChange={(value) => handleChange('actionType', value)}
                  fullWidth
                />
              </div>

              {/* Entity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Тип объекта
                </label>
                <Select
                  options={entityTypeOptions}
                  value={filters.entityType || ''}
                  onChange={(value) => handleChange('entityType', value)}
                  fullWidth
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Период
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="От"
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleChange('dateRange.start', e.target.value)}
                  fullWidth
                />
                <Input
                  label="До"
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleChange('dateRange.end', e.target.value)}
                  fullWidth
                />
              </div>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Пользователь
              </label>
              <Select
                options={userOptions}
                value={filters.userId?.toString() || ''}
                onChange={(value) => handleChange('userId', value ? parseInt(value) : undefined)}
                fullWidth
              />
            </div>

            {/* Active Filters Summary */}
            {getActiveFilters().length > 0 && (
              <div className="bg-dark-800/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-2">Активные фильтры:</h4>
                <div className="flex flex-wrap gap-2">
                  {getActiveFilters().map((filter, index) => (
                    <span
                      key={index}
                      className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded"
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Сбросить
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Применить
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PassportLogFilters;