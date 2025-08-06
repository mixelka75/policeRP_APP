// src/components/common/UserAvatar.tsx
import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { getDiscordAvatarUrl, getDisplayName, testDiscordCDN } from '@/utils';
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
  const [cdnTested, setCdnTested] = useState(false);

  useEffect(() => {
    // Тестируем CDN Discord только один раз
    if (!cdnTested && preferDiscord) {
      testDiscordCDN().then((accessible) => {
        if (!accessible) {
          console.warn('UserAvatar: Discord CDN not accessible, falling back immediately');
          setDiscordFailed(true);
        }
        setCdnTested(true);
      });
    }
  }, [preferDiscord, cdnTested]);

  // If preferDiscord is true, try Discord avatar first
  if (preferDiscord && !discordFailed) {
    const avatarUrl = getDiscordAvatarUrl(user, size);
    console.log('UserAvatar: Using Discord avatar for user:', user.discord_username, 'URL:', avatarUrl);
    
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <img
          src={avatarUrl}
          alt={`${getDisplayName(user)} avatar`}
          className="rounded-full"
          style={{ width: size, height: size }}
          onError={(e) => {
            console.log('UserAvatar: Discord avatar failed to load for user:', user.discord_username, 'URL:', avatarUrl);
            setDiscordFailed(true);
          }}
          onLoad={() => {
            console.log('UserAvatar: Discord avatar loaded successfully for user:', user.discord_username);
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
  const fallbackAvatarUrl = getDiscordAvatarUrl(user, size);
  console.log('UserAvatar: Using fallback Discord avatar for user:', user.discord_username, 'URL:', fallbackAvatarUrl);
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {!discordFailed && (
        <img
          src={fallbackAvatarUrl}
          alt={`${getDisplayName(user)} avatar`}
          className="rounded-full"
          style={{ width: size, height: size }}
          onError={(e) => {
            console.log('UserAvatar: Fallback Discord avatar failed for user:', user.discord_username, 'URL:', fallbackAvatarUrl);
            setDiscordFailed(true);
          }}
          onLoad={() => {
            console.log('UserAvatar: Fallback Discord avatar loaded successfully for user:', user.discord_username);
          }}
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