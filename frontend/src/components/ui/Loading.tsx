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
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text = 'Загрузка...',
  fullScreen = false,
  className,
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

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={cn('text-primary-500', sizeClasses)} />
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
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;