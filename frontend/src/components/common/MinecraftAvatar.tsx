// src/components/common/MinecraftAvatar.tsx
import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';

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
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when nickname changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [nickname]);

  // Use simple single API approach
  const getAvatarUrl = (username: string, size: number) => {
    // Try Minotar first - it's most reliable
    return `https://minotar.net/avatar/${username}/${size}.png`;
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
      <img
        src={getAvatarUrl(nickname, size)}
        alt={`${nickname} Minecraft avatar`}
        className={`${roundedClass} object-cover`}
        style={{ width: size, height: size }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default MinecraftAvatar;