// src/components/ui/Button.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'; // ✨ ДОБАВЛЕН success
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 focus:ring-offset-dark-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'rounded-lg border',
    {
      'w-full': fullWidth,
      'text-sm px-3 py-2': size === 'sm',
      'text-base px-4 py-2.5': size === 'md',
      'text-lg px-6 py-3': size === 'lg',
    }
  );

  const variantClasses = cn({
    'bg-primary-600 border-primary-600 text-white hover:bg-primary-700 hover:border-primary-700 active:bg-primary-800':
      variant === 'primary',
    'bg-dark-700 border-dark-600 text-dark-100 hover:bg-dark-600 hover:border-dark-500 active:bg-dark-500':
      variant === 'secondary',
    'bg-transparent border-dark-600 text-dark-100 hover:bg-dark-800 hover:border-dark-500 active:bg-dark-700':
      variant === 'outline',
    'bg-transparent border-transparent text-dark-400 hover:text-dark-100 hover:bg-dark-800 active:bg-dark-700':
      variant === 'ghost',
    'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700 active:bg-red-800':
      variant === 'danger',
    // ✨ НОВЫЙ вариант success
    'bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 active:bg-green-800':
      variant === 'success',
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseClasses, variantClasses, className)}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {!loading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  );
};

export default Button;