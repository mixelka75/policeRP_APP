// src/components/modals/ExportModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  File,
  Table,
  Calendar,
  Filter,
  Settings
} from 'lucide-react';
import { Modal, Button, Select, Input, Badge } from '@/components/ui';
import { formatDate } from '@/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: 'passports' | 'fines' | 'users' | 'logs';
  onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  dateRange: {
    start?: string;
    end?: string;
  };
  filters: {
    includeInactive?: boolean;
    includeDeleted?: boolean;
    minAmount?: number;
    maxAmount?: number;
  };
  fields: string[];
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dataType,
  onExport,
}) => {
  const [format, setFormat] = useState<'json' | 'csv' | 'excel' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [filters, setFilters] = useState({
    includeInactive: false,
    includeDeleted: false,
    minAmount: '',
    maxAmount: '',
  });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: Table },
    { value: 'excel', label: 'Excel', icon: File },
    { value: 'json', label: 'JSON', icon: FileText },
    { value: 'pdf', label: 'PDF', icon: FileText },
  ];

  const getAvailableFields = () => {
    switch (dataType) {
      case 'passports':
        return [
          'id', 'first_name', 'last_name', 'nickname',
          'age', 'gender', 'created_at', 'updated_at'
        ];
      case 'fines':
        return [
          'id', 'passport_id', 'article', 'amount',
          'description', 'created_at', 'created_by_user_id'
        ];
      case 'users':
        return [
          'id', 'username', 'role', 'is_active',
          'created_at', 'updated_at'
        ];
      case 'logs':
        return [
          'id', 'user_id', 'action', 'entity_type',
          'entity_id', 'details', 'ip_address', 'created_at'
        ];
      default:
        return [];
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      id: 'ID',
      first_name: 'Имя',
      last_name: 'Фамилия',
      nickname: 'Никнейм',
      age: 'Возраст',
      gender: 'Пол',
      passport_id: 'ID паспорта',
      article: 'Статья',
      amount: 'Сумма',
      description: 'Описание',
      username: 'Имя пользователя',
      role: 'Роль',
      is_active: 'Активен',
      user_id: 'ID пользователя',
      action: 'Действие',
      entity_type: 'Тип объекта',
      entity_id: 'ID объекта',
      details: 'Детали',
      ip_address: 'IP адрес',
      created_at: 'Создан',
      updated_at: 'Обновлен',
      created_by_user_id: 'Создал пользователь',
    };
    return labels[field] || field;
  };

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      dateRange: {
        start: dateRange.start || undefined,
        end: dateRange.end || undefined,
      },
      filters: {
        includeInactive: filters.includeInactive,
        includeDeleted: filters.includeDeleted,
        minAmount: filters.minAmount ? parseInt(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? parseInt(filters.maxAmount) : undefined,
      },
      fields: selectedFields.length > 0 ? selectedFields : getAvailableFields(),
    };

    onExport(options);
    onClose();
  };

  const getDataTypeName = () => {
    switch (dataType) {
      case 'passports': return 'Паспорта';
      case 'fines': return 'Штрафы';
      case 'users': return 'Пользователи';
      case 'logs': return 'Логи';
      default: return 'Данные';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Экспорт данных - ${getDataTypeName()}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Формат экспорта
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {formatOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormat(option.value as any)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  format === option.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <option.icon className={`h-6 w-6 ${
                    format === option.value ? 'text-primary-400' : 'text-dark-400'
                  }`} />
                  <span className={`font-medium ${
                    format === option.value ? 'text-primary-400' : 'text-dark-200'
                  }`}>
                    {option.label}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Диапазон дат
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Начальная дата"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              fullWidth
            />
            <Input
              label="Конечная дата"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              fullWidth
            />
          </div>
        </div>

        {/* Filters */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры
          </h3>
          <div className="space-y-4">
            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.includeInactive}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeInactive: e.target.checked }))}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500/20"
                />
                <span className="text-sm text-dark-300">Включить неактивных</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.includeDeleted}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeDeleted: e.target.checked }))}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500/20"
                />
                <span className="text-sm text-dark-300">Включить удаленных</span>
              </label>
            </div>

            {/* Amount Range (for fines) */}
            {dataType === 'fines' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Минимальная сумма"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  placeholder="0"
                  fullWidth
                />
                <Input
                  label="Максимальная сумма"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  placeholder="1000000"
                  fullWidth
                />
              </div>
            )}
          </div>
        </div>

        {/* Field Selection */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">
            Поля для экспорта
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {getAvailableFields().map((field) => (
              <label key={field} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFields(prev => [...prev, field]);
                    } else {
                      setSelectedFields(prev => prev.filter(f => f !== field));
                    }
                  }}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500/20"
                />
                <span className="text-sm text-dark-300">{getFieldLabel(field)}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFields(getAvailableFields())}
            >
              Выбрать все
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFields([])}
            >
              Очистить
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-dark-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Сводка экспорта:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">
              Формат: {format.toUpperCase()}
            </Badge>
            <Badge variant="info">
              Полей: {selectedFields.length || getAvailableFields().length}
            </Badge>
            {dateRange.start && (
              <Badge variant="warning">
                С: {formatDate(dateRange.start)}
              </Badge>
            )}
            {dateRange.end && (
              <Badge variant="warning">
                По: {formatDate(dateRange.end)}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Экспортировать
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;