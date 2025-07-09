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
        <div className="bg-dark-800 border border-dark-600 rounded-lg overflow-hidden">
          <div className="bg-dark-700 px-6 py-4">
            <div className="flex space-x-4">
              {columns.map((_, index) => (
                <div
                  key={index}
                  className="h-4 bg-dark-600 rounded flex-1"
                />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4 border-t border-dark-600">
              <div className="flex space-x-4">
                {columns.map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="h-4 bg-dark-700 rounded flex-1"
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
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-12 text-center">
        <p className="text-dark-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-dark-800 border border-dark-600 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-dark-700 px-6 py-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
          {columns.map((column) => (
            <div
              key={column.key}
              className="text-sm font-medium text-dark-200 uppercase tracking-wider"
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-dark-600">
        {data.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * 0.05 }}
            className={cn(
              'px-6 py-4 transition-colors duration-150',
              {
                'hover:bg-dark-700 cursor-pointer': onRowClick,
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
  );
};

export default Table;