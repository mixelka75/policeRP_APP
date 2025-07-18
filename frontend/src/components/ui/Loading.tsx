// src/components/ui/Loading.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text = 'Загрузка...',
  fullScreen = false,
  className,
  variant = 'primary',
}) => {
  const sizeClasses = cn({
    'h-4 w-4': size === 'sm',
    'h-8 w-8': size === 'md',
    'h-12 w-12': size === 'lg',
  });

  const textSizeClasses = cn({
    'text-sm': size === 'sm',
    'text-base': size === 'md',
    'text-lg': size === 'lg',
  });

  // ✨ ОБНОВЛЕННЫЕ цвета для спиннера
  const spinnerClasses = cn({
    'text-primary-500': variant === 'primary',
    'text-secondary-500': variant === 'secondary',
    'text-accent-500': variant === 'accent',
  });

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      {/* ✨ ОБНОВЛЕННЫЙ спиннер с градиентом */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="relative"
      >
        {/* Основной спиннер */}
        <Loader2 className={cn(spinnerClasses, sizeClasses)} />

        {/* ✨ НОВЫЙ: Дополнительное свечение для больших размеров */}
        {size === 'lg' && (
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 opacity-30"
          >
            <div className={cn(
              'w-full h-full rounded-full border-2 border-transparent',
              'bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500',
              'animate-pulse'
            )} style={{
              backgroundClip: 'border-box',
              WebkitBackgroundClip: 'border-box',
            }} />
          </motion.div>
        )}
      </motion.div>

      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn('text-dark-400 font-medium', textSizeClasses)}
        >
          {text}
        </motion.p>
      )}

      {/* ✨ НОВЫЙ: Дополнительные точки анимации для полноэкранного режима */}
      {fullScreen && (
        <motion.div
          className="flex space-x-1 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i === 0 ? 'var(--color-primary)' :
                           i === 1 ? 'var(--color-secondary)' :
                           'var(--color-accent)'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-minecraft-dark flex items-center justify-center z-50">
        {/* ✨ НОВЫЙ: Фоновая анимация частиц */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-20"
              style={{
                background: i % 3 === 0 ? 'var(--color-primary)' :
                           i % 3 === 1 ? 'var(--color-secondary)' :
                           'var(--color-accent)',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default Loading;