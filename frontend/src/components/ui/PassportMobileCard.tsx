import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Shield } from 'lucide-react';
import { Passport } from '@/types';
import { MinecraftHead } from '@/components/common';
import { Badge } from '@/components/ui';
import { cn } from '@/utils';

interface PassportMobileCardProps {
  passport: Passport;
  onViewDetails: (passport: Passport) => void;
  className?: string;
}

const PassportMobileCard: React.FC<PassportMobileCardProps> = ({
  passport,
  onViewDetails,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md',
        'border border-white/20 rounded-3xl p-6 text-center',
        'shadow-xl shadow-black/20',
        'hover:shadow-2xl hover:shadow-primary-500/20',
        'transition-all duration-300 hover:scale-[1.02]',
        'min-h-[320px]',
        className
      )}
    >
      {/* Avatar Section */}
      <div className="flex justify-center mb-4">
        <div className={cn(
          'relative rounded-2xl p-1',
          passport.is_emergency 
            ? 'bg-gradient-to-r from-red-500/30 to-red-600/30 ring-2 ring-red-500/50' 
            : 'bg-gradient-to-r from-primary-500/30 to-secondary-500/30 ring-2 ring-primary-500/50'
        )}>
          {passport.is_emergency && (
            <div className="absolute -top-2 -right-2 z-10">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
          )}
          <MinecraftHead
            discordId={passport.discord_id}
            passportId={passport.id}
            size="xl"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Name and Emergency Badge */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-white mb-1">
          {passport.first_name} {passport.last_name}
        </h3>
        {passport.is_emergency && (
          <Badge variant="danger" size="sm" className="mb-2">
            ЧС
          </Badge>
        )}
        {passport.nickname && (
          <p className="text-sm text-primary-400 font-medium">
            {passport.nickname}
          </p>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center justify-center mb-4">
        <MapPin className="h-4 w-4 text-primary-400 mr-2" />
        <span className="text-primary-300 font-medium">
          {passport.city}
        </span>
      </div>

      {/* Stats */}
      <div className="flex justify-center space-x-6 mb-6">
        {/* Violations */}
        <div className="text-center">
          <div className={cn(
            'text-2xl font-bold mb-1',
            passport.violations_count > 0 ? 'text-red-400' : 'text-green-400'
          )}>
            {passport.violations_count}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Нарушения
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className={cn(
            'text-2xl font-bold mb-1 flex items-center justify-center',
            passport.is_emergency ? 'text-red-400' : 'text-green-400'
          )}>
            {passport.is_emergency ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Shield className="h-6 w-6" />
            )}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Статус
          </div>
        </div>
      </div>

      {/* Details Button */}
      <button
        onClick={() => onViewDetails(passport)}
        className={cn(
          'w-full py-3 px-6 rounded-2xl font-semibold text-white',
          'bg-gradient-to-r from-primary-600 to-secondary-600',
          'hover:from-primary-500 hover:to-secondary-500',
          'transition-all duration-200 transform hover:scale-105',
          'shadow-lg hover:shadow-xl',
          'active:scale-95'
        )}
      >
        Подробнее
      </button>
    </motion.div>
  );
};

export default PassportMobileCard;