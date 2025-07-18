// src/components/modals/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Modal, Button, Input, Select } from '@/components/ui';

export interface FilterOptions {
  dateRange: {
    start?: string;
    end?: string;
  };
  amount?: {
    min?: number;
    max?: number;
  };
  gender?: string;
  role?: string;
  isActive?: string;
  status?: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  onReset: () => void;
  type: 'passports' | 'fines' | 'users' | 'logs';
  currentFilters?: FilterOptions;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  type,
  currentFilters = {},
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      dateRange: {},
      amount: {},
    });
    onReset();
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFilters(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof FilterOptions],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const getTitle = () => {
    switch (type) {
      case 'passports': return 'Фильтры паспортов';
      case 'fines': return 'Фильтры штрафов';
      case 'users': return 'Фильтры пользователей';
      case 'logs': return 'Фильтры логов';
      default: return 'Фильтры';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="md"
    >
      <div className="space-y-6">
        {/* Date Range */}
        <div>
          <h3 className="text-sm font-medium text-dark-200 mb-3">Период</h3>
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

        {/* Amount Range for Fines */}
        {type === 'fines' && (
          <div>
            <h3 className="text-sm font-medium text-dark-200 mb-3">Сумма штрафа</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="От (АР)"
                type="number"
                value={filters.amount?.min?.toString() || ''}
                onChange={(e) => handleChange('amount.min', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
                fullWidth
              />
              <Input
                label="До (АР)"
                type="number"
                value={filters.amount?.max?.toString() || ''}
                onChange={(e) => handleChange('amount.max', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1000000"
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Gender for Passports */}
        {type === 'passports' && (
          <div>
            <h3 className="text-sm font-medium text-dark-200 mb-3">Пол</h3>
            <Select
              options={[
                { value: '', label: 'Все' },
                { value: 'male', label: 'Мужской' },
                { value: 'female', label: 'Женский' },
              ]}
              value={filters.gender || ''}
              onChange={(value) => handleChange('gender', value)}
              fullWidth
            />
          </div>
        )}

        {/* Role and Status for Users */}
        {type === 'users' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-dark-200 mb-3">Роль</h3>
              <Select
                options={[
                  { value: '', label: 'Все' },
                  { value: 'admin', label: 'Администратор' },
                  { value: 'police', label: 'Полицейский' },
                ]}
                value={filters.role || ''}
                onChange={(value) => handleChange('role', value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-dark-200 mb-3">Статус</h3>
              <Select
                options={[
                  { value: '', label: 'Все' },
                  { value: 'true', label: 'Активные' },
                  { value: 'false', label: 'Заблокированные' },
                ]}
                value={filters.isActive || ''}
                onChange={(value) => handleChange('isActive', value)}
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Applied Filters Summary */}
        <div className="bg-dark-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Активные фильтры:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.dateRange?.start && (
              <span className="text-xs bg-secondary-500/20 text-secondary-400 px-2 py-1 rounded">
                От: {filters.dateRange.start}
              </span>
            )}
            {filters.dateRange?.end && (
              <span className="text-xs bg-secondary-500/20 text-secondary-400 px-2 py-1 rounded">
                До: {filters.dateRange.end}
              </span>
            )}
            {filters.amount?.min && (
              <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded">
                От: {filters.amount.min} АР
              </span>
            )}
            {filters.amount?.max && (
              <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded">
                До: {filters.amount.max} АР
              </span>
            )}
            {filters.gender && (
              <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-1 rounded">
                {filters.gender === 'male' ? 'Мужской' : 'Женский'}
              </span>
            )}
            {filters.role && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                {filters.role === 'admin' ? 'Администратор' : 'Полицейский'}
              </span>
            )}
            {filters.isActive && (
              <span className="text-xs bg-warning-500/20 text-warning-400 px-2 py-1 rounded">
                {filters.isActive === 'true' ? 'Активные' : 'Заблокированные'}
              </span>
            )}
            {Object.keys(filters).length === 0 && (
              <span className="text-xs text-dark-400">Фильтры не применены</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Сбросить
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Применить
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;