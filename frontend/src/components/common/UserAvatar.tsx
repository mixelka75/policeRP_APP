// src/components/common/UserAvatar.tsx
import React, { useState } from 'react';
import { User } from '@/types';
import { getDiscordAvatarUrl, getDisplayName } from '@/utils';
import MinecraftAvatar from './MinecraftAvatar';

interface UserAvatarProps {
  user: User;
  size?: number;
  className?: string;
  showStatus?: boolean;
  preferDiscord?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  className = '',
  showStatus = false,
  preferDiscord = false
}) => {
  const [minecraftFailed, setMinecraftFailed] = useState(false);
  const [discordFailed, setDiscordFailed] = useState(false);

  // If preferDiscord is true, try Discord avatar first
  if (preferDiscord && !discordFailed) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <img
          src={getDiscordAvatarUrl(user, size)}
          alt={`${getDisplayName(user)} avatar`}
          className="rounded-full"
          style={{ width: size, height: size }}
          onError={() => setDiscordFailed(true)}
        />
        {showStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-dark-800 ${
            user.is_active ? 'bg-green-500' : 'bg-red-500'
          }`} style={{ width: size * 0.3, height: size * 0.3 }} />
        )}
      </div>
    );
  }

  // If user has minecraft_username and minecraft hasn't failed, try Minecraft avatar
  if (!preferDiscord && user.minecraft_username && user.minecraft_username.trim() && !minecraftFailed) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <MinecraftAvatar
          nickname={user.minecraft_username}
          size={size}
          shape="circle"
          showFallback={true}
        />
        {/* Hidden test image to detect minecraft failures */}
        <img
          src={`https://minotar.net/avatar/${user.minecraft_username}/${size}.png`}
          alt=""
          style={{ display: 'none' }}
          onError={() => {
            console.log('UserAvatar: Minecraft avatar failed for user:', user.discord_username, 'nickname:', user.minecraft_username);
            setMinecraftFailed(true);
          }}
        />
        {showStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-dark-800 ${
            user.is_active ? 'bg-green-500' : 'bg-red-500'
          }`} style={{ width: size * 0.3, height: size * 0.3 }} />
        )}
      </div>
    );
  }

  // Fallback to Discord avatar or initials  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {!discordFailed && (
        <img
          src={getDiscordAvatarUrl(user, size)}
          alt={`${getDisplayName(user)} avatar`}
          className="rounded-full"
          style={{ width: size, height: size }}
          onError={() => setDiscordFailed(true)}
        />
      )}
      {discordFailed && (
        <div
          className={`rounded-full flex items-center justify-center ${
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
      )}
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-dark-800 ${
          user.is_active ? 'bg-green-500' : 'bg-red-500'
        }`} style={{ width: size * 0.3, height: size * 0.3 }} />
      )}
    </div>
  );
};

export default UserAvatar;