import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Shield, MoreVertical, Eye } from 'lucide-react';
import { Passport } from '@/types';
import { MinecraftHead } from '@/components/common';
import { Badge, ActionsDropdown, ActionItem } from '@/components/ui';
import { cn } from '@/utils';
import { formatDate, formatRelativeTime } from '@/utils';

interface EmergencyMobileCardProps {
  passport: Passport;
  onRemoveFromEmergency: (passport: Passport) => void;
  onViewDetails?: (passport: Passport) => void;
  className?: string;
}

const EmergencyMobileCard: React.FC<EmergencyMobileCardProps> = ({
  passport,
  onRemoveFromEmergency,
  onViewDetails,
  className,
}) => {
  const actions: ActionItem[] = [
    {
      key: 'remove',
      label: 'Убрать из ЧС',
      icon: Shield,
      onClick: () => onRemoveFromEmergency(passport),
      color: 'success'
    },
    ...(onViewDetails ? [{
      key: 'view',
      label: 'Подробнее',
      icon: Eye,
      onClick: () => onViewDetails(passport),
      color: 'primary' as const
    }] : [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md',
        'border border-red-500/30 rounded-3xl p-6 text-center',
        'shadow-xl shadow-red-500/10',
        'hover:shadow-2xl hover:shadow-red-500/20',
        'transition-all duration-300 hover:scale-[1.02]',
        'min-h-[380px] relative',
        className
      )}
    >
      {/* Actions Menu */}
      <div className="absolute top-4 right-4">
        <ActionsDropdown 
          actions={actions} 
          variant="ghost"
          size="sm"
          trigger={<MoreVertical className="h-4 w-4 text-gray-400" />}
        />
      </div>

      {/* Avatar Section with Theater Masks Icon */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          {/* Theater masks icon background */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl">
            <div className="text-4xl">🎭</div>
          </div>
          
          <div className="relative rounded-2xl p-1 bg-gradient-to-r from-red-500/30 to-red-600/30 ring-2 ring-red-500/50">
            <div className="absolute -top-2 -right-2 z-10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <MinecraftHead
              discordId={passport.discord_id}
              passportId={passport.id}
              size="xl"
              className="rounded-xl relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Name and Emergency Badge */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-white mb-1">
          {passport.first_name} {passport.last_name}
        </h3>
        <Badge variant="danger" size="sm" className="mb-2">
          ЧС
        </Badge>
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
      <div className="flex justify-center space-x-6 mb-4">
        {/* Violations */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
            <div className="text-lg font-bold text-green-400">
              {passport.violations_count || 0}
            </div>
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Нарушения
          </div>
        </div>
      </div>

      {/* Date Information */}
      <div className="space-y-2 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-400 uppercase tracking-wide mb-1">
            В городе с
          </div>
          <div className="text-white font-medium">
            {formatDate(passport.entry_date, 'dd.MM.yyyy')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 uppercase tracking-wide mb-1">
            Последнее изменение
          </div>
          <div className="text-green-400 text-sm">
            {formatRelativeTime(passport.updated_at)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencyMobileCard;