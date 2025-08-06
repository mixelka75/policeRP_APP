// src/components/ui/StatCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'final' | 'green' | 'red' | 'yellow' | 'purple' | 'blue' | 'success' | 'danger';
  trend?: {
    value: number;
    isPositive: boolean;
    text: string;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
  className,
}) => {
  // ✨ ОБНОВЛЕННЫЕ цветовые классы с новой схемой
  const colorClasses = cn({
    // Новые основные цвета
    'bg-primary-500/10 text-primary-400 border-primary-500/20': color === 'primary',
    'bg-secondary-500/10 text-secondary-400 border-secondary-500/20': color === 'secondary' || color === 'blue',
    'bg-accent-500/10 text-accent-400 border-accent-500/20': color === 'accent' || color === 'purple',
    'bg-final-500/10 text-final-400 border-final-500/20': color === 'final',

    // Функциональные цвета (остаются без изменений)
    'bg-green-500/10 text-green-400 border-green-500/20': color === 'green' || color === 'success',
    'bg-red-500/10 text-red-400 border-red-500/20': color === 'red' || color === 'danger',
    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': color === 'yellow',
  });

  const iconBgClasses = cn({
    // Новые фоны для иконок
    'bg-primary-500/20': color === 'primary',
    'bg-secondary-500/20': color === 'secondary' || color === 'blue',
    'bg-accent-500/20': color === 'accent' || color === 'purple',
    'bg-final-500/20': color === 'final',

    // Функциональные фоны
    'bg-green-500/20': color === 'green' || color === 'success',
    'bg-red-500/20': color === 'red' || color === 'danger',
    'bg-yellow-500/20': color === 'yellow',
  });

  // ✨ ОБНОВЛЕННЫЕ hover эффекты с новыми цветами
  const hoverClasses = cn({
    'hover:shadow-primary-glow': color === 'primary',
    'hover:shadow-secondary-glow': color === 'secondary',
    'hover:shadow-accent-glow': color === 'accent',
    'hover:shadow-lg': ['final', 'green', 'red', 'yellow', 'purple', 'blue'].includes(color),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'bg-dark-800 border border-dark-600 rounded-xl shadow-lg',
        'hover:shadow-xl hover:border-dark-500 transition-all duration-200',
        'h-[120px] sm:h-[130px] md:h-[140px] flex flex-col justify-between',
        'p-4 sm:p-5 md:p-6',
        hoverClasses,
        className
      )}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 flex flex-col justify-between h-full min-w-0">
          <div>
            <p className="text-xs sm:text-sm font-medium text-dark-400 mb-1 truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-100 mb-1 truncate">
              {value}
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            {subtitle && (
              <p className="text-xs sm:text-sm text-dark-300 mb-1 truncate">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center space-x-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-dark-400 truncate">
                  {trend.text}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={cn(
          'p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0 ml-2 sm:ml-3',
          iconBgClasses
        )}>
          <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', colorClasses)} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;