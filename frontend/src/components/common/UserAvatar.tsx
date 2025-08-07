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
    if (!cdnTested && preferDiscord && user) {
      console.log('UserAvatar: Testing Discord CDN for user:', user.discord_username, 'Avatar:', user.discord_avatar);
      testDiscordCDN().then((accessible) => {
        if (!accessible) {
          console.warn('UserAvatar: Discord CDN not accessible, falling back immediately');
          setDiscordFailed(true);
        } else {
          console.log('UserAvatar: Discord CDN is accessible');
        }
        setCdnTested(true);
      }).catch((error) => {
        console.error('UserAvatar: CDN test error:', error);
        setDiscordFailed(true);
        setCdnTested(true);
      });
    }
  }, [preferDiscord, cdnTested, user]);

  // If preferDiscord is true, try Discord avatar first
  if (preferDiscord && !discordFailed) {
    const avatarUrl = getDiscordAvatarUrl(user, size);
    console.log('UserAvatar: Processing Discord avatar for user:', {
      discord_username: user.discord_username,
      discord_id: user.discord_id,
      discord_avatar: user.discord_avatar,
      discord_discriminator: user.discord_discriminator,
      generated_url: avatarUrl,
      preferDiscord,
      discordFailed
    });
    
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <img
          src={avatarUrl}
          alt={`${getDisplayName(user)} avatar`}
          className="rounded-full"
          style={{ width: size, height: size }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error('UserAvatar: Discord avatar failed to load for user:', user.discord_username, 'URL:', avatarUrl);
            console.error('UserAvatar: Error details:', {
              naturalWidth: target.naturalWidth,
              naturalHeight: target.naturalHeight,
              complete: target.complete,
              src: target.src
            });
            setDiscordFailed(true);
          }}
          onLoad={() => {
            console.log('UserAvatar: Discord avatar loaded successfully for user:', user.discord_username, 'URL:', avatarUrl);
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

  // Final fallback - try Discord avatar once more, if fails show initials
  if (!discordFailed) {
    const fallbackAvatarUrl = getDiscordAvatarUrl(user, size);
    console.log('UserAvatar: Using fallback Discord avatar for user:', user.discord_username, 'URL:', fallbackAvatarUrl);
    
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <img
          src={fallbackAvatarUrl}
          alt={`${getDisplayName(user)} avatar`}
          className="rounded-full"
          style={{ width: size, height: size }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error('UserAvatar: Fallback Discord avatar failed for user:', user.discord_username, 'URL:', fallbackAvatarUrl);
            console.error('UserAvatar: Fallback error details:', {
              naturalWidth: target.naturalWidth,
              naturalHeight: target.naturalHeight,
              complete: target.complete,
              src: target.src
            });
            setDiscordFailed(true);
          }}
          onLoad={() => {
            console.log('UserAvatar: Fallback Discord avatar loaded successfully for user:', user.discord_username);
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

  // Ultimate fallback - show initials
  console.log('UserAvatar: All Discord options failed, showing initials for user:', user.discord_username);
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div
        className={`rounded-full flex items-center justify-center ${
          user.role === 'admin' 
            ? 'bg-gradient-to-br from-red-500 to-red-600'
            : user.role === 'police'
            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : 'bg-gradient-to-br from-gray-500 to-gray-600'
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