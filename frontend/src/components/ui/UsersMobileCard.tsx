import React from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Shield, Crown, CheckCircle, AlertTriangle, RefreshCw, UserX, UserCheck, ExternalLink, MoreHorizontal } from 'lucide-react';
import { User } from '@/types';
import { Badge, ActionsDropdown, ActionItem } from '@/components/ui';
// import { getDiscordAvatarUrl } from '@/utils';
import { cn } from '@/utils';

interface UsersMobileCardProps {
  user: User;
  onViewDetails: (user: User) => void;
  onCheckRoles?: (user: User) => void;
  onStatusChange?: (user: User) => void;
  currentUserId?: number;
  className?: string;
}

const UsersMobileCard: React.FC<UsersMobileCardProps> = ({
  user,
  onViewDetails,
  onCheckRoles,
  onStatusChange,
  currentUserId,
  className,
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Crown;
      case 'police':
        return Shield;
      default:
        return UserIcon;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400';
      case 'police':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'АДМИН';
      case 'police':
        return 'ПОЛИЦИЯ';
      default:
        return 'ЖИТЕЛЬ';
    }
  };

  const RoleIcon = getRoleIcon(user.role);
  const avatarUrl = user.discord_avatar 
    ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png`
    : null;

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
          user.is_active 
            ? 'bg-gradient-to-r from-green-500/30 to-green-600/30 ring-2 ring-green-500/50' 
            : 'bg-gradient-to-r from-gray-500/30 to-gray-600/30 ring-2 ring-gray-500/50'
        )}>
          {!user.is_active && (
            <div className="absolute -top-2 -right-2 z-10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          )}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-700 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.discord_username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <UserIcon className={cn(
              'h-8 w-8 text-gray-400',
              avatarUrl && 'hidden'
            )} />
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-white mb-1 truncate">
          {user.discord_username}
        </h3>
        <Badge 
          variant={user.role === 'admin' ? 'warning' : user.role === 'police' ? 'primary' : 'secondary'} 
          size="sm" 
          className="mb-2"
        >
          {getRoleName(user.role)}
        </Badge>
        <p className="text-sm text-gray-400 truncate">
          @{user.discord_username}#{user.discord_discriminator}
        </p>
      </div>

      {/* Minecraft Username */}
      {user.minecraft_username && (
        <div className="flex items-center justify-center mb-4">
          <span className="text-sm text-primary-400 font-medium">
            MC: {user.minecraft_username}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-center space-x-6 mb-6">
        {/* Role */}
        <div className="text-center">
          <div className={cn(
            'text-2xl font-bold mb-1 flex items-center justify-center',
            getRoleColor(user.role)
          )}>
            <RoleIcon className="h-6 w-6" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Роль
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className={cn(
            'text-2xl font-bold mb-1 flex items-center justify-center',
            user.is_active ? 'text-green-400' : 'text-red-400'
          )}>
            {user.is_active ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            {user.is_active ? 'Активен' : 'Неактивен'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(user)}
          className={cn(
            'flex-1 py-3 px-4 rounded-2xl font-semibold text-white',
            'bg-gradient-to-r from-primary-600 to-secondary-600',
            'hover:from-primary-500 hover:to-secondary-500',
            'transition-all duration-200 transform hover:scale-105',
            'shadow-lg hover:shadow-xl',
            'active:scale-95'
          )}
        >
          Подробнее
        </button>
        
        {(onCheckRoles || onStatusChange) && (
          <div className="flex-shrink-0">
            <ActionsDropdown
              actions={[
                ...(onCheckRoles ? [{
                  key: 'checkRoles',
                  label: 'Проверить роли',
                  icon: RefreshCw,
                  onClick: () => onCheckRoles(user),
                  color: 'primary' as const
                }] : []),
                ...(onStatusChange ? [{
                  key: 'toggleStatus',
                  label: user.is_active ? 'Деактивировать' : 'Активировать',
                  icon: user.is_active ? UserX : UserCheck,
                  onClick: () => onStatusChange(user),
                  color: user.is_active ? 'danger' : 'success' as const,
                  disabled: user.id === currentUserId
                }] : []),
                {
                  key: 'discord',
                  label: 'Открыть в Discord',
                  icon: ExternalLink,
                  onClick: () => window.open(`https://discord.com/users/${user.discord_id}`, '_blank'),
                  color: 'secondary' as const
                }
              ]}
              variant="minimal"
              trigger={
                <button className={cn(
                  'p-3 rounded-2xl',
                  'bg-white/10 hover:bg-white/20',
                  'border border-white/20',
                  'transition-all duration-200',
                  'text-white hover:text-primary-400'
                )}>
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UsersMobileCard;