// src/components/ui/Badge.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200',
    {
      'px-2 py-0.5 text-xs': size === 'sm',
      'px-3 py-1 text-sm': size === 'md',
      'px-4 py-1.5 text-base': size === 'lg',
    }
  );

  const variantClasses = cn({
    'bg-primary-500/20 text-primary-400 border border-primary-500/30': variant === 'primary',
    'bg-dark-600 text-dark-300 border border-dark-500': variant === 'secondary',
    'bg-green-500/20 text-green-400 border border-green-500/30': variant === 'success',
    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30': variant === 'warning',
    'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'danger',
    'bg-blue-500/20 text-blue-400 border border-blue-500/30': variant === 'info',
  });

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(baseClasses, variantClasses, className)}
    >
      {children}
    </motion.span>
  );
};

export default Badge;