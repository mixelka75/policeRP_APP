import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import AvatarCache from '@/utils/avatarCache';

interface PlayerSkinProps {
  passportId?: number;
  discordId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
}

interface SkinData {
  skin_url: string;
  uuid: string;
  nickname?: string;
  username?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const PlayerSkin: React.FC<PlayerSkinProps> = ({
  passportId,
  discordId,
  className = '',
  size = 'md',
  fallbackText
}) => {
  const [skinData, setSkinData] = useState<SkinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSkin = async () => {
      if (!passportId && !discordId) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        setError(false);

        let data;
        if (passportId) {
          data = await apiService.getPassportSkin(passportId);
        } else if (discordId) {
          data = await apiService.getSkinByDiscordId(discordId);
        }

        if (data) {
          const nickname = ('nickname' in data ? data.nickname : data.username) || 'Unknown';
          
          // Проверяем кеш
          const cached = AvatarCache.get(nickname);
          if (cached) {
            setSkinData({
              skin_url: cached.url,
              uuid: cached.uuid,
              nickname: 'nickname' in data ? cached.nickname : undefined,
              username: 'username' in data ? cached.nickname : undefined
            });
          } else {
            // Сохраняем в кеш
            AvatarCache.set(nickname, data.skin_url, data.uuid);
            setSkinData({
              skin_url: data.skin_url,
              uuid: data.uuid,
              nickname: 'nickname' in data ? data.nickname : undefined,
              username: 'username' in data ? data.username || undefined : undefined
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch player skin:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSkin();
  }, [passportId, discordId]);

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 animate-pulse rounded-md flex items-center justify-center`}>
        <div className="text-gray-400 text-xs">⟳</div>
      </div>
    );
  }

  if (error || !skinData) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-300 rounded-md flex items-center justify-center text-gray-600`}>
        <span className="text-xs font-medium">
          {fallbackText || (skinData?.nickname || skinData?.username || '?')[0]?.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-md overflow-hidden`}>
      <img
        src={skinData.skin_url}
        alt={`Скин ${skinData.nickname || skinData.username || 'игрока'}`}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default PlayerSkin;