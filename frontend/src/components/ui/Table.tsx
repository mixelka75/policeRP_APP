// src/components/ui/Table.tsx - УЛУЧШЕННАЯ версия для мобильных устройств
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  mobileHidden?: boolean; // ✨ НОВОЕ: скрыть на мобильных
  tabletHidden?: boolean; // ✨ НОВОЕ: скрыть на планшетах
  intermediateHidden?: boolean; // ✨ НОВОЕ: скрыть на промежуточных экранах (1024-1280px)
  priority?: 'high' | 'medium' | 'low'; // ✨ НОВОЕ: приоритет отображения
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: any) => void;
  onViewDetails?: (row: any) => void; // ✨ НОВОЕ: для кнопки "Подробнее"
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Нет данных',
  className,
  onRowClick,
  onViewDetails,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/30 rounded-lg overflow-hidden">
          <div className="bg-black/20 backdrop-blur-sm border-b border-primary-500/30 px-4 sm:px-6 py-4">
            <div className="flex space-x-4">
              {columns.slice(0, 3).map((_, index) => (
                <div
                  key={index}
                  className="h-4 bg-primary-500/20 rounded flex-1"
                />
              ))}
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="px-4 sm:px-6 py-4 border-t border-primary-500/30">
              <div className="flex space-x-4">
                {columns.slice(0, 3).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="h-4 bg-secondary-500/20 rounded flex-1"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/30 rounded-lg p-8 sm:p-12 text-center">
        <p className="text-dark-400 text-base sm:text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // ✨ Фильтруем колонки для разных устройств
  const tabletColumns = columns.filter(col => !col.tabletHidden && !col.mobileHidden);
  const mobileColumns = columns.filter(col => !col.mobileHidden || col.key === 'actions');
  
  // ✨ Промежуточные экраны (1024-1280px) - скрываем низкоприоритетные
  const intermediateColumns = columns.filter(col => 
    !col.intermediateHidden && !col.tabletHidden && !col.mobileHidden
  );
  
  // ✨ Высокоприоритетные колонки для планшетов (максимум 3)
  const highPriorityTabletColumns = tabletColumns.filter(col => 
    col.priority === 'high' || col.key === 'actions'
  ).slice(0, 3);
  
  // ✨ Высокоприоритетные и средние колонки для промежуточных экранов
  const priorityIntermediateColumns = intermediateColumns.filter(col => 
    col.priority === 'high' || col.priority === 'medium' || col.key === 'actions'
  );

  return (
    <div className={cn('bg-dark-800/50 backdrop-blur-sm border border-primary-500/30 rounded-lg overflow-hidden', className)}>
      {/* ✨ Large Desktop Table - все колонки */}
      <div className="hidden xl:block">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-primary-500/30 px-6 py-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
            {columns.map((column) => (
              <div
                key={column.key}
                className="text-sm font-medium text-primary-300 uppercase tracking-wider truncate"
              >
                {column.label}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-primary-500/30">
          {data.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className={cn(
                'px-6 py-4 transition-all duration-150',
                {
                  'hover:bg-primary-500/5 hover:border-primary-500/40 cursor-pointer': onRowClick,
                }
              )}
              onClick={() => onRowClick?.(row)}
            >
              <div className="grid gap-2" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="text-sm text-dark-100 min-w-0"
                  >
                    <div className={column.key === 'actions' ? 'flex justify-end overflow-visible' : 'truncate'}>
                      {column.key === 'actions' ? (
                        <div className="flex-shrink-0">
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]
                          }
                        </div>
                      ) : (
                        column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ✨ НОВЫЙ: Intermediate Table (lg screens 1024-1280px) */}
      <div className="hidden lg:block xl:hidden">
        <div className="divide-y divide-primary-500/30">
          {data.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className={cn(
                'p-4 sm:p-5 md:p-6 transition-all duration-150',
                'border-b border-primary-500/30 last:border-b-0',
                {
                  'hover:bg-primary-500/5 hover:border-primary-500/40 cursor-pointer': onRowClick,
                }
              )}
              onClick={() => onRowClick?.(row)}
            >
              {/* Основная информация - высокие и средние приоритеты */}
              <div className="grid grid-cols-2 gap-4">
                {priorityIntermediateColumns.filter(col => col.key !== 'actions').map((column) => {
                  const value = column.render
                    ? column.render(row[column.key], row)
                    : row[column.key];

                  if (!value && value !== 0) return null;

                  return (
                    <div key={column.key} className="flex flex-col space-y-1 min-w-0">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                        {column.label}
                      </span>
                      <div className="text-sm text-dark-100 min-w-0">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Действия и кнопка "Подробнее" для скрытых полей */}
              <div className="mt-4 pt-3 border-t border-primary-500/30 flex justify-between items-center">
                {/* Кнопка "Подробнее" если есть скрытые низкоприоритетные поля */}
                {columns.filter(col => col.priority === 'low').length > 0 && onViewDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(row);
                    }}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
                  >
                    Подробнее
                  </button>
                )}
                
                {/* Actions */}
                {columns.find(col => col.key === 'actions') && (
                  <div className="flex justify-end overflow-visible">
                    <div className="flex-shrink-0">
                      {columns.find(col => col.key === 'actions')?.render?.(row['actions'], row)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ✨ УЛУЧШЕННАЯ Tablet Table (medium screens) */}
      <div className="hidden md:block lg:hidden">
        <div className="divide-y divide-primary-500/30">
          {data.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className={cn(
                'p-4 sm:p-5 transition-all duration-150',
                'border-b border-primary-500/30 last:border-b-0',
                {
                  'hover:bg-primary-500/5 hover:border-primary-500/40 cursor-pointer': onRowClick,
                }
              )}
              onClick={() => onRowClick?.(row)}
            >
              {/* Основная информация - только высокоприоритетные поля */}
              <div className="grid grid-cols-1 gap-3">
                {highPriorityTabletColumns.filter(col => col.key !== 'actions').map((column) => {
                  const value = column.render
                    ? column.render(row[column.key], row)
                    : row[column.key];

                  if (!value && value !== 0) return null;

                  return (
                    <div key={column.key} className="flex justify-between items-start py-1">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider min-w-0 mr-4 flex-shrink-0">
                        {column.label}
                      </span>
                      <div className="text-sm text-dark-100 text-right min-w-0 flex-1">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Действия и кнопка "Подробнее" */}
              <div className="mt-4 pt-3 border-t border-primary-500/30 flex justify-between items-center">
                {/* Кнопка "Подробнее" для скрытых полей */}
                {tabletColumns.length > highPriorityTabletColumns.length && onViewDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(row);
                    }}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
                  >
                    Подробнее
                  </button>
                )}
                
                {/* Actions */}
                {columns.find(col => col.key === 'actions') && (
                  <div className="flex justify-end overflow-visible">
                    <div className="flex-shrink-0">
                      {columns.find(col => col.key === 'actions')?.render?.(row['actions'], row)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ✨ УЛУЧШЕННАЯ Mobile Cards */}
      <div className="md:hidden">
        <div className="space-y-3">
          {data.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className={cn(
                'bg-dark-800/60 backdrop-blur-sm border border-primary-500/40 rounded-xl p-4 transition-all duration-200',
                {
                  'hover:bg-primary-500/5 hover:border-primary-500/60 cursor-pointer hover:shadow-lg hover:shadow-primary-500/10': onRowClick,
                  'active:bg-primary-500/10 active:scale-[0.98]': onRowClick,
                }
              )}
              onClick={() => onRowClick?.(row)}
            >
              {/* Верхняя секция с гражданином и суммой */}
              <div className="flex items-start justify-between mb-4">
                {/* Информация о гражданине */}
                <div className="flex-1 min-w-0">
                  {mobileColumns.find(col => col.key === 'citizen') && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                        ГРАЖДАНИН
                      </div>
                      <div className="text-sm text-dark-100">
                        {mobileColumns.find(col => col.key === 'citizen')?.render?.(row['citizen'], row)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Сумма и статус */}
                <div className="ml-4 text-right flex-shrink-0">
                  {mobileColumns.find(col => col.key === 'amount') && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                        СУММА
                      </div>
                      <div className="text-base font-bold text-red-400">
                        {mobileColumns.find(col => col.key === 'amount')?.render?.(row['amount'], row)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Статья */}
              {mobileColumns.find(col => col.key === 'article') && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                    СТАТЬЯ
                  </div>
                  <div className="text-sm text-dark-100 font-medium">
                    {mobileColumns.find(col => col.key === 'article')?.render?.(row['article'], row)}
                  </div>
                </div>
              )}

              {/* Статус */}
              {mobileColumns.find(col => col.key === 'status') && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    СТАТУС
                  </div>
                  <div className="flex items-center">
                    {mobileColumns.find(col => col.key === 'status')?.render?.(row['status'], row)}
                  </div>
                </div>
              )}

              {/* Действия и кнопка "Подробнее" */}
              <div className="pt-3 border-t border-primary-500/30 flex justify-between items-center">
                {/* Кнопка "Подробнее" для скрытых полей на мобильных */}
                {columns.filter(col => col.mobileHidden).length > 0 && onViewDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(row);
                    }}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium px-2 py-1 rounded hover:bg-primary-500/10"
                  >
                    Подробнее
                  </button>
                )}
                
                {/* Actions */}
                {columns.find(col => col.key === 'actions') && (
                  <div className="flex justify-end overflow-visible">
                    <div className="flex-shrink-0">
                      {columns.find(col => col.key === 'actions')?.render?.(row['actions'], row)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Table;