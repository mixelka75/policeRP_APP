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
  variant?: 'default' | 'glass' | 'minecraft' | 'glow';
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
  onClick,
  variant = 'default',
}) => {
  const paddingClasses = cn({
    'p-4': padding === 'sm',
    'p-6': padding === 'md',
    'p-8': padding === 'lg',
  });

  const variantClasses = cn({
    // Default card
    'bg-black/20 backdrop-blur-sm border border-purple-500/30 shadow-lg': variant === 'default',

    // Glass card
    'bg-black/10 backdrop-blur-md border border-white/10 shadow-glass': variant === 'glass',

    // Minecraft themed card
    'minecraft-card': variant === 'minecraft',

    // Glowing card
    'bg-black/20 backdrop-blur-sm border border-purple-500/50 shadow-glow animate-glow': variant === 'glow',
  });

  const hoverClasses = cn({
    'hover:shadow-xl hover:border-purple-500/50 hover:bg-black/30': hover && variant === 'default',
    'hover:shadow-minecraft-hover hover:border-purple-500/50': hover && variant === 'minecraft',
    'hover:shadow-glass hover:border-white/20': hover && variant === 'glass',
    'hover:shadow-neon': hover && variant === 'glow',
  });

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.3 },
        y: { duration: 0.3 }
      }}
      className={cn(
        'rounded-xl transition-all duration-300 group',
        variantClasses,
        hoverClasses,
        paddingClasses,
        {
          'cursor-pointer': onClick,
          'text-left w-full': onClick,
          'transform-gpu': true, // Optimize for GPU
        },
        className
      )}
      onClick={onClick}
    >
      {variant === 'minecraft' && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-xl pointer-events-none" />
      )}

      {variant === 'glow' && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl pointer-events-none animate-pulse" />
      )}

      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

export default Card;