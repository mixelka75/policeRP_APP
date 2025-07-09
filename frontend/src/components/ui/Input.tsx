import React from 'react';
import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  ...props
}) => {
  const inputClasses = cn(
    'w-full bg-dark-800 border border-dark-600 text-dark-100 placeholder-dark-400',
    'rounded-lg px-4 py-3 text-base transition-all duration-200',
    'focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    {
      'pl-12': leftIcon,
      'pr-12': rightIcon,
      'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
    },
    className
  );

  return (
    <div className={cn('space-y-2', { 'w-full': fullWidth })}>
      {label && (
        <label className="block text-sm font-medium text-dark-200">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400">
            {leftIcon}
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400 animate-slide-in">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;