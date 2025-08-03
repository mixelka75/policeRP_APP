// src/components/common/MinecraftAvatar.tsx
import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { apiService } from '@/services/api';
import AvatarCache from '@/utils/avatarCache';

interface MinecraftAvatarProps {
  nickname?: string;
  size?: number;
  className?: string;
  showFallback?: boolean;
  shape?: 'square' | 'circle';
}

const MinecraftAvatar: React.FC<MinecraftAvatarProps> = ({
  nickname,
  size = 40,
  className = '',
  showFallback = true,
  shape = 'square'
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when nickname changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    setAvatarUrl(null);
    
    if (nickname) {
      loadAvatar();
    } else {
      setIsLoading(false);
    }
  }, [nickname, size]);

  const loadAvatar = async () => {
    if (!nickname) return;
    
    // Сначала проверяем кеш
    const cached = AvatarCache.get(nickname);
    if (cached) {
      setAvatarUrl(cached.url);
      setIsLoading(false);
      return;
    }
    
    try {
      // Загружаем из API если нет в кеше
      const response = await apiService.getAvatarByNickname(nickname);
      const avatarUrl = response.skin_url;
      
      // Сохраняем в кеш
      AvatarCache.set(nickname, avatarUrl, response.uuid);
      setAvatarUrl(avatarUrl);
    } catch (error) {
      console.log('Failed to load avatar from API, using fallback:', error);
      // Fallback to minotar.net
      const fallbackUrl = `https://minotar.net/avatar/${nickname}/${size}.png`;
      setAvatarUrl(fallbackUrl);
      
      // Кешируем и fallback URL
      AvatarCache.set(nickname, fallbackUrl, '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.log('MinecraftAvatar: Failed to load avatar for nickname:', nickname);
    setImageError(true);
    setIsLoading(false);
  };

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  // If no nickname provided or image failed to load, show fallback
  if (!nickname || imageError || !nickname.trim()) {
    if (!showFallback) return null;
    
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-700 ${roundedClass} ${className}`}
        style={{ width: size, height: size }}
      >
        <UserIcon 
          className="text-white" 
          size={size * 0.6} 
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${roundedClass} ${className}`} style={{ width: size, height: size }}>
      {isLoading && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-700 ${roundedClass} animate-pulse z-10`}
          style={{ width: size, height: size }}
        >
          <UserIcon 
            className="text-white opacity-50" 
            size={size * 0.6} 
          />
        </div>
      )}
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={`${nickname} Minecraft avatar`}
          className={`${roundedClass} object-cover`}
          style={{ width: size, height: size }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

export default MinecraftAvatar;