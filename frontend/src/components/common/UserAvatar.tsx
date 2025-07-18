// src/components/common/UserAvatar.tsx
import React from 'react';
import { User } from '@/types';
import { getDiscordAvatarUrl, getDisplayName } from '@/utils';

interface UserAvatarProps {
  user: User;
  size?: number;
  className?: string;
  showStatus?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  className = '',
  showStatus = false
}) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src={getDiscordAvatarUrl(user, size)}
        alt={`${getDisplayName(user)} avatar`}
        className="rounded-full"
        style={{ width: size, height: size }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      <div
        className={`absolute inset-0 rounded-full flex items-center justify-center ${
          user.role === 'admin' 
            ? 'bg-gradient-to-br from-red-500 to-red-600'
            : 'bg-gradient-to-br from-primary-500 to-secondary-500'
        }`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-medium" style={{ fontSize: `${size * 0.4}px` }}>
          {getDisplayName(user).charAt(0).toUpperCase()}
        </span>
      </div>
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-dark-800 ${
          user.is_active ? 'bg-green-500' : 'bg-red-500'
        }`} style={{ width: size * 0.3, height: size * 0.3 }} />
      )}
    </div>
  );
};

export default UserAvatar;

// src/components/common/UserSelect.tsx
import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { Select } from '@/components/ui';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { getDisplayName, getFullUserName } from '@/utils';

interface UserSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  adminOnly?: boolean;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Выберите пользователя',
  label = 'Пользователь',
  adminOnly = false
}) => {
  const [users, setUsers] = useState<User[]>([]);

  const { execute: fetchUsers } = useApi(apiService.getUsers);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await fetchUsers();
        const filteredUsers = adminOnly
          ? fetchedUsers.filter(user => user.role === 'admin')
          : fetchedUsers;
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };

    loadUsers();
  }, [adminOnly]);

  const userOptions = users.map(user => ({
    value: user.id.toString(),
    label: `${getDisplayName(user)} (${getFullUserName(user)})`,
  }));

  return (
    <Select
      label={label}
      options={userOptions}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      placeholder={placeholder}
      fullWidth
    />
  );
};

export { UserAvatar, UserSelect };

// src/components/common/UserInfo.tsx
import React from 'react';
import { User } from '@/types';
import { MessageCircle, Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui';
import { UserAvatar } from './UserAvatar';
import {
  getDisplayName,
  getFullUserName,
  getRoleDisplayName,
  isUserDataOutdated,
  formatDate
} from '@/utils';

interface UserInfoProps {
  user: User;
  showDetails?: boolean;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const UserInfo: React.FC<UserInfoProps> = ({
  user,
  showDetails = true,
  showStatus = true,
  size = 'md'
}) => {
  const avatarSize = size === 'sm' ? 32 : size === 'md' ? 40 : 48;

  return (
    <div className="flex items-center space-x-3">
      <UserAvatar
        user={user}
        size={avatarSize}
        showStatus={showStatus}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className={`font-medium text-white truncate ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
          }`}>
            {getDisplayName(user)}
          </p>
          <MessageCircle className="h-3 w-3 text-secondary-400" />
          {user.role === 'admin' ? (
            <ShieldCheck className="h-4 w-4 text-red-400" />
          ) : (
            <Shield className="h-4 w-4 text-primary-400" />
          )}
        </div>

        {showDetails && (
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-dark-400">
              <span>{getFullUserName(user)}</span>
              {user.minecraft_username && (
                <>
                  <span>•</span>
                  <span>{user.minecraft_username}</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-xs ${
                user.role === 'admin' ? 'text-red-400' : 'text-primary-400'
              }`}>
                {getRoleDisplayName(user.role)}
              </span>

              {isUserDataOutdated(user) && (
                <Badge variant="warning" size="sm">
                  Устарело
                </Badge>
              )}

              {!user.is_active && (
                <Badge variant="danger" size="sm">
                  Неактивен
                </Badge>
              )}
            </div>

            <p className="text-xs text-dark-500">
              Последняя проверка: {formatDate(user.last_role_check)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;

// src/components/common/index.ts
export { default as UserAvatar } from './UserAvatar';
export { default as UserSelect } from './UserSelect';
export { default as UserInfo } from './UserInfo';