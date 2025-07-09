// src/components/ui/Card.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
  onClick,
}) => {
  const paddingClasses = cn({
    'p-4': padding === 'sm',
    'p-6': padding === 'md',
    'p-8': padding === 'lg',
  });

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'bg-dark-800 border border-dark-600 rounded-xl shadow-lg',
        'transition-all duration-200',
        paddingClasses,
        {
          'hover:shadow-xl hover:border-dark-500': hover,
          'cursor-pointer': onClick,
          'text-left w-full': onClick,
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

export default Card;