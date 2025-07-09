// src/components/ui/StatCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
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
  icon: Icon,
  color = 'blue',
  trend,
  className,
}) => {
  const colorClasses = cn({
    'bg-blue-500/10 text-blue-400 border-blue-500/20': color === 'blue',
    'bg-green-500/10 text-green-400 border-green-500/20': color === 'green',
    'bg-red-500/10 text-red-400 border-red-500/20': color === 'red',
    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': color === 'yellow',
    'bg-purple-500/10 text-purple-400 border-purple-500/20': color === 'purple',
  });

  const iconBgClasses = cn({
    'bg-blue-500/20': color === 'blue',
    'bg-green-500/20': color === 'green',
    'bg-red-500/20': color === 'red',
    'bg-yellow-500/20': color === 'yellow',
    'bg-purple-500/20': color === 'purple',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'bg-dark-800 border border-dark-600 rounded-xl p-6 shadow-lg',
        'hover:shadow-xl hover:border-dark-500 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-dark-100 mb-2">
            {value}
          </p>
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
              <span className="text-xs text-dark-400">
                {trend.text}
              </span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconBgClasses)}>
          <Icon className={cn('h-6 w-6', colorClasses)} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;