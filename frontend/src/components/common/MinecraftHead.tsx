// src/components/common/MinecraftHead.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import AvatarCache from '@/utils/avatarCache';

interface MinecraftHeadProps {
  discordId?: string;
  passportId?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showNickname?: boolean;
}

const MinecraftHead: React.FC<MinecraftHeadProps> = ({
  discordId,
  passportId,
  size = 'md',
  className = '',
  showNickname = false,
}) => {
  const [skinData, setSkinData] = useState<{
    skinUrl: string;
    nickname: string;
    uuid: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  useEffect(() => {
    const fetchSkinData = async () => {
      if (!discordId && !passportId) return;

      setIsLoading(true);
      setError(null);

      try {
        let response;
        let cacheKey = '';
        
        if (passportId) {
          cacheKey = `passport_${passportId}`;
          response = await apiService.getPassportSkin(passportId);
        } else if (discordId) {
          cacheKey = `discord_${discordId}`;
          response = await apiService.getSkinByDiscordId(discordId);
        }

        if (response) {
          const nickname = response.nickname || response.username || 'Unknown';
          
          // Проверяем кеш для nickname
          const cached = AvatarCache.get(nickname);
          if (cached) {
            setSkinData({
              skinUrl: cached.url,
              nickname: cached.nickname,
              uuid: cached.uuid,
            });
          } else {
            // Сохраняем в кеш
            AvatarCache.set(nickname, response.skin_url, response.uuid);
            setSkinData({
              skinUrl: response.skin_url,
              nickname: nickname,
              uuid: response.uuid,
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to load skin data:', err);
        setError(err.response?.data?.detail || 'Не удалось загрузить скин');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkinData();
  }, [discordId, passportId]);

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !skinData) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex flex-col items-center gap-1`}>
        <div className={`${sizeClasses[size]} bg-dark-600 border border-dark-500 rounded-lg flex items-center justify-center`}>
          {error ? (
            <AlertCircle className="w-1/2 h-1/2 text-red-400" />
          ) : (
            <User className="w-1/2 h-1/2 text-dark-400" />
          )}
        </div>
        {showNickname && (
          <span className={`${textSizeClasses[size]} text-dark-400 text-center`}>
            {error ? 'Ошибка' : 'Нет данных'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`${sizeClasses[size]} relative`}
      >
        <img
          src={skinData.skinUrl}
          alt={`Скин ${skinData.nickname}`}
          className={`${sizeClasses[size]} rounded-lg border-2 border-primary-500/30 object-cover`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement?.classList.add('bg-dark-600', 'border-dark-500');
          }}
        />
        
        {/* Hover эффект */}
        <motion.div
          className="absolute inset-0 bg-primary-500/20 rounded-lg opacity-0 transition-opacity duration-200"
          whileHover={{ opacity: 1 }}
        />
      </motion.div>

      {showNickname && skinData.nickname && (
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`${textSizeClasses[size]} text-secondary-300 font-medium text-center max-w-20 truncate`}
          title={skinData.nickname}
        >
          {skinData.nickname}
        </motion.span>
      )}
    </div>
  );
};

export default MinecraftHead;