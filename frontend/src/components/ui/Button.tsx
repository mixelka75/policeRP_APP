// src/components/ui/Button.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'minecraft';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  glow = false,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 focus:ring-offset-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'rounded-xl border overflow-hidden',
    'transform-gpu', // GPU optimization
    {
      'w-full': fullWidth,
      'text-sm px-3 py-2': size === 'sm',
      'text-base px-4 py-2.5': size === 'md',
      'text-lg px-6 py-3': size === 'lg',
    }
  );

  const variantClasses = cn({
    // Primary - Новый градиент
    'bg-gradient-to-r from-primary-500 to-secondary-500 border-primary-500/50 text-white shadow-primary-glow hover:shadow-minecraft-hover active:scale-95':
      variant === 'primary',

    // Secondary - Использует accent цвета
    'bg-black/30 backdrop-blur-sm border-accent-500/30 text-white hover:bg-black/50 hover:border-accent-500/50':
      variant === 'secondary',

    // Outline - Новая схема
    'bg-transparent border-primary-500/50 text-primary-300 hover:bg-primary-500/10 hover:border-primary-500/70 hover:text-primary-200':
      variant === 'outline',

    // Ghost - Обновленные цвета
    'bg-transparent border-transparent text-gray-300 hover:text-white hover:bg-black/20':
      variant === 'ghost',

    // Danger - Красный остается
    'bg-gradient-to-r from-red-600 to-red-500 border-red-500/50 text-white shadow-red-500/30 hover:shadow-red-500/40 active:scale-95':
      variant === 'danger',

    // Success - Зеленый остается
    'bg-gradient-to-r from-green-600 to-emerald-600 border-green-500/50 text-white shadow-green-500/30 hover:shadow-green-500/40 active:scale-95':
      variant === 'success',

    // Minecraft - Новый градиент
    'minecraft-button animate-glow bg-gradient-to-r from-primary-400 via-secondary-500 to-accent-500':
      variant === 'minecraft',
  });

  const glowClasses = cn({
    'shadow-primary-glow animate-pulse': glow,
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  // Use regular button for ghost variant to avoid motion conflicts
  const shouldUseMotion = variant !== 'ghost';
  
  if (!shouldUseMotion) {
    return (
      <button
        className={cn(baseClasses, variantClasses, glowClasses, className)}
        disabled={disabled || loading}
        onClick={handleClick}
        type={props.type || "button"}
        {...props}
      >
        {/* Glow effect */}
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/50 to-secondary-500/50 blur-lg opacity-50 -z-10" />
        )}

        {/* Loading spinner */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.div>
        )}

        {/* Content */}
        <div className={cn(
          'relative z-10 flex items-center gap-2 transition-opacity duration-200',
          loading && 'opacity-0'
        )}>
          {!loading && leftIcon && (
            <span className="flex-shrink-0">
              {leftIcon}
            </span>
          )}

          <span className="font-medium">{children}</span>

          {!loading && rightIcon && (
            <span className="flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{
        scale: 1.02,
        y: -1,
      }}
      whileTap={{
        scale: 0.98,
        y: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      className={cn(baseClasses, variantClasses, glowClasses, className)}
      disabled={disabled || loading}
      onClick={handleClick}
      type={props.type || "button"}
      {...(props as any)}
    >
      {/* Background gradient overlay */}
      {(variant === 'primary' || variant === 'minecraft') && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Glow effect */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/50 to-secondary-500/50 blur-lg opacity-50 -z-10" />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </motion.div>
      )}

      {/* Content */}
      <div className={cn(
        'relative z-10 flex items-center gap-2 transition-opacity duration-200',
        loading && 'opacity-0'
      )}>
        {!loading && leftIcon && (
          <motion.span
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {leftIcon}
          </motion.span>
        )}

        <span className="font-medium">{children}</span>

        {!loading && rightIcon && (
          <motion.span
            className="flex-shrink-0"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};

export default Button;