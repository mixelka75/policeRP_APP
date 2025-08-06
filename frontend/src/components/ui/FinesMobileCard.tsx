import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Fine } from '@/types';
import { Badge } from '@/components/ui';
import { formatDate, formatMoney } from '@/utils';
import { cn } from '@/utils';

interface FinesMobileCardProps {
  fine: Fine & { passport_info?: { first_name: string; last_name: string; nickname?: string } };
  onViewDetails: (fine: Fine) => void;
  className?: string;
}

const FinesMobileCard: React.FC<FinesMobileCardProps> = ({
  fine,
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
      {/* Article/Icon Section */}
      <div className="flex justify-center mb-4">
        <div className={cn(
          'relative rounded-2xl p-4',
          fine.is_paid 
            ? 'bg-gradient-to-r from-green-500/30 to-green-600/30 ring-2 ring-green-500/50' 
            : 'bg-gradient-to-r from-red-500/30 to-red-600/30 ring-2 ring-red-500/50'
        )}>
          {fine.is_paid ? (
            <CheckCircle className="h-12 w-12 text-green-400" />
          ) : (
            <Receipt className="h-12 w-12 text-red-400" />
          )}
        </div>
      </div>

      {/* Fine Info */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-white mb-1 truncate">
          {fine.article}
        </h3>
        <Badge variant={fine.is_paid ? "success" : "danger"} size="sm" className="mb-2">
          {fine.is_paid ? "ОПЛАЧЕНО" : "НЕ ОПЛАЧЕНО"}
        </Badge>
        {fine.passport_info && (
          <p className="text-sm text-primary-400 font-medium truncate">
            {fine.passport_info.first_name} {fine.passport_info.last_name}
            {fine.passport_info.nickname && ` (@${fine.passport_info.nickname})`}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="flex items-center justify-center mb-4">
        <DollarSign className="h-4 w-4 text-primary-400 mr-2" />
        <span className={cn(
          'text-2xl font-bold',
          fine.is_paid ? 'text-green-400' : 'text-red-400'
        )}>
          {formatMoney(fine.amount)} ₽
        </span>
      </div>

      {/* Stats */}
      <div className="flex justify-center space-x-6 mb-6">
        {/* Status Icon */}
        <div className="text-center">
          <div className={cn(
            'text-2xl font-bold mb-1 flex items-center justify-center',
            fine.is_paid ? 'text-green-400' : 'text-red-400'
          )}>
            {fine.is_paid ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Clock className="h-6 w-6" />
            )}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            {fine.is_paid ? 'ОПЛАЧЕН' : 'АКТИВЕН'}
          </div>
        </div>

        {/* Date */}
        <div className="text-center">
          <div className="text-sm text-primary-300 mb-1 flex items-center justify-center">
            <Calendar className="h-4 w-4 mr-1" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            {formatDate(fine.created_at, 'dd.MM.yy')}
          </div>
        </div>
      </div>

      {/* Details Button */}
      <button
        onClick={() => onViewDetails(fine)}
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

export default FinesMobileCard;