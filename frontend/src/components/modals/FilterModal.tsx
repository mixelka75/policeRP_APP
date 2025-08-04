// src/components/modals/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Modal, Button, Input, Select } from '@/components/ui';

export interface FilterOptions {
  dateRange?: {
    start?: string;
    end?: string;
  };
  amount?: {
    min?: number;
    max?: number;
  };
  age?: {
    min?: number;
    max?: number;
  };
  violationsCount?: {
    min?: number;
    max?: number;
  };
  gender?: string;
  role?: string;
  isActive?: string;
  status?: string;
  city?: string;
  isEmergency?: string;
  isPaid?: string;
  article?: string;
  issuer?: string;
  action?: string;
  entityType?: string;
  userRole?: string;
  ipAddress?: string;
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
    setFilters({});
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
        {/* Date Range - Common for all types */}
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Период</h3>
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

        {/* Passports Specific Filters */}
        {type === 'passports' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Пол</h3>
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
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Город</h3>
              <Input
                placeholder="Название города"
                value={filters.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Возраст</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="От"
                  type="number"
                  value={filters.age?.min?.toString() || ''}
                  onChange={(e) => handleChange('age.min', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="18"
                  fullWidth
                />
                <Input
                  label="До"
                  type="number"
                  value={filters.age?.max?.toString() || ''}
                  onChange={(e) => handleChange('age.max', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="100"
                  fullWidth
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Статус ЧС</h3>
              <Select
                options={[
                  { value: '', label: 'Все' },
                  { value: 'true', label: 'В ЧС' },
                  { value: 'false', label: 'Не в ЧС' },
                ]}
                value={filters.isEmergency || ''}
                onChange={(value) => handleChange('isEmergency', value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Количество нарушений</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="От"
                  type="number"
                  value={filters.violationsCount?.min?.toString() || ''}
                  onChange={(e) => handleChange('violationsCount.min', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                  fullWidth
                />
                <Input
                  label="До"
                  type="number"
                  value={filters.violationsCount?.max?.toString() || ''}
                  onChange={(e) => handleChange('violationsCount.max', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="100"
                  fullWidth
                />
              </div>
            </div>
          </div>
        )}

        {/* Fines Specific Filters */}
        {type === 'fines' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Сумма штрафа</h3>
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
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Статус оплаты</h3>
              <Select
                options={[
                  { value: '', label: 'Все' },
                  { value: 'true', label: 'Оплачено' },
                  { value: 'false', label: 'Не оплачено' },
                ]}
                value={filters.isPaid || ''}
                onChange={(value) => handleChange('isPaid', value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Статья нарушения</h3>
              <Input
                placeholder="Поиск по статье"
                value={filters.article || ''}
                onChange={(e) => handleChange('article', e.target.value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Выписал</h3>
              <Input
                placeholder="Имя сотрудника"
                value={filters.issuer || ''}
                onChange={(e) => handleChange('issuer', e.target.value)}
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Users Specific Filters */}
        {type === 'users' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Роль</h3>
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
              <h3 className="text-sm font-medium text-white mb-3">Статус</h3>
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

        {/* Logs Specific Filters */}
        {type === 'logs' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Тип действия</h3>
              <Select
                options={[
                  { value: '', label: 'Все действия' },
                  { value: 'CREATE', label: 'Создание' },
                  { value: 'UPDATE', label: 'Обновление' },
                  { value: 'DELETE', label: 'Удаление' },
                  { value: 'LOGIN', label: 'Вход' },
                  { value: 'VIEW', label: 'Просмотр' },
                  { value: 'EMERGENCY_STATUS_CHANGE', label: 'Изменение ЧС' },
                ]}
                value={filters.action || ''}
                onChange={(value) => handleChange('action', value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Тип объекта</h3>
              <Select
                options={[
                  { value: '', label: 'Все объекты' },
                  { value: 'passport', label: 'Паспорт' },
                  { value: 'fine', label: 'Штраф' },
                  { value: 'user', label: 'Пользователь' },
                  { value: 'payment', label: 'Платеж' },
                ]}
                value={filters.entityType || ''}
                onChange={(value) => handleChange('entityType', value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Роль пользователя</h3>
              <Select
                options={[
                  { value: '', label: 'Все роли' },
                  { value: 'admin', label: 'Администратор' },
                  { value: 'police', label: 'Полицейский' },
                ]}
                value={filters.userRole || ''}
                onChange={(value) => handleChange('userRole', value)}
                fullWidth
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">IP адрес</h3>
              <Input
                placeholder="192.168.1.1"
                value={filters.ipAddress || ''}
                onChange={(e) => handleChange('ipAddress', e.target.value)}
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Applied Filters Summary */}
        <div className="bg-dark-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Активные фильтры:</h4>
          <div className="flex flex-wrap gap-2">
            {/* Date Range */}
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
            
            {/* Amount Range */}
            {filters.amount?.min && (
              <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded">
                Сумма от: {filters.amount.min} АР
              </span>
            )}
            {filters.amount?.max && (
              <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded">
                Сумма до: {filters.amount.max} АР
              </span>
            )}
            
            {/* Age Range */}
            {filters.age?.min && (
              <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-1 rounded">
                Возраст от: {filters.age.min}
              </span>
            )}
            {filters.age?.max && (
              <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-1 rounded">
                Возраст до: {filters.age.max}
              </span>
            )}
            
            {/* Violations Count Range */}
            {filters.violationsCount?.min && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                Нарушения от: {filters.violationsCount.min}
              </span>
            )}
            {filters.violationsCount?.max && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                Нарушения до: {filters.violationsCount.max}
              </span>
            )}
            
            {/* Gender */}
            {filters.gender && (
              <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                {filters.gender === 'male' ? 'Мужской' : 'Женский'}
              </span>
            )}
            
            {/* City */}
            {filters.city && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                Город: {filters.city}
              </span>
            )}
            
            {/* Emergency Status */}
            {filters.isEmergency && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                {filters.isEmergency === 'true' ? 'В ЧС' : 'Не в ЧС'}
              </span>
            )}
            
            {/* Payment Status */}
            {filters.isPaid && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                {filters.isPaid === 'true' ? 'Оплачено' : 'Не оплачено'}
              </span>
            )}
            
            {/* Article */}
            {filters.article && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                Статья: {filters.article}
              </span>
            )}
            
            {/* Issuer */}
            {filters.issuer && (
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                Выписал: {filters.issuer}
              </span>
            )}
            
            {/* Role */}
            {filters.role && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                {filters.role === 'admin' ? 'Администратор' : 'Полицейский'}
              </span>
            )}
            
            {/* Active Status */}
            {filters.isActive && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                {filters.isActive === 'true' ? 'Активные' : 'Заблокированные'}
              </span>
            )}
            
            {/* Action */}
            {filters.action && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                Действие: {filters.action}
              </span>
            )}
            
            {/* Entity Type */}
            {filters.entityType && (
              <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded">
                Объект: {filters.entityType}
              </span>
            )}
            
            {/* User Role */}
            {filters.userRole && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                Роль: {filters.userRole === 'admin' ? 'Администратор' : 'Полицейский'}
              </span>
            )}
            
            {/* IP Address */}
            {filters.ipAddress && (
              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                IP: {filters.ipAddress}
              </span>
            )}
            
            {/* No filters applied */}
            {Object.keys(filters).every(key => !filters[key as keyof FilterOptions] || 
              (typeof filters[key as keyof FilterOptions] === 'object' && 
               Object.keys(filters[key as keyof FilterOptions] as object).length === 0)) && (
              <span className="text-xs text-gray-400">Фильтры не применены</span>
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