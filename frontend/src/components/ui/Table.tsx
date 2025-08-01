// src/components/ui/Table.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: any) => void;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Нет данных',
  className,
  onRowClick,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/30 rounded-lg overflow-hidden">
          <div className="bg-black/20 backdrop-blur-sm border-b border-primary-500/30 px-6 py-4">
            <div className="flex space-x-4">
              {columns.map((_, index) => (
                <div
                  key={index}
                  className="h-4 bg-primary-500/20 rounded flex-1"
                />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4 border-t border-primary-500/30">
              <div className="flex space-x-4">
                {columns.map((_, colIndex) => (
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
      <div className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/30 rounded-lg p-12 text-center">
        <p className="text-dark-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-dark-800/50 backdrop-blur-sm border border-primary-500/30 rounded-lg overflow-hidden', className)}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-primary-500/30 px-6 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
            {columns.map((column) => (
              <div
                key={column.key}
                className="text-sm font-medium text-primary-300 uppercase tracking-wider"
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
              <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="text-sm text-dark-100"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="divide-y divide-primary-500/30">
          {data.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className={cn(
                'p-4 transition-all duration-150',
                {
                  'hover:bg-primary-500/5 hover:border-primary-500/40 cursor-pointer': onRowClick,
                }
              )}
              onClick={() => onRowClick?.(row)}
            >
              <div className="space-y-3">
                {columns.map((column) => {
                  if (column.key === 'actions') return null; // Skip actions column in mobile view
                  
                  const value = column.render
                    ? column.render(row[column.key], row)
                    : row[column.key];
                  
                  if (!value && value !== 0) return null; // Skip empty values
                  
                  return (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider min-w-0 mr-2">
                        {column.label}
                      </span>
                      <div className="text-sm text-dark-100 text-right min-w-0 flex-1">
                        {value}
                      </div>
                    </div>
                  );
                })}
                
                {/* Mobile Actions */}
                {columns.find(col => col.key === 'actions') && (
                  <div className="pt-2 border-t border-primary-500/30">
                    {columns.find(col => col.key === 'actions')?.render?.(row['actions'], row)}
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