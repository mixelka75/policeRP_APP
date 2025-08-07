// src/components/common/UserPassportCard.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Gamepad2,
  MessageCircle,
  Coins
} from 'lucide-react';
import { Card, Badge, Loading } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';
import type { Passport } from '@/types';
import { formatDate, getErrorMessage } from '@/utils';
import MinecraftAvatar from './MinecraftAvatar';

const UserPassportCard: React.FC = () => {
  const {
    data: passport,
    isLoading,
    error,
    execute: fetchPassport,
  } = useApi(apiService.getMyPassport, {
    showErrorToast: false,
  });

  useEffect(() => {
    fetchPassport();
  }, []);

  if (isLoading) {
    return (
      <Card variant="minecraft" className="p-6">
        <Loading text="Загрузка паспорта..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="minecraft" className="p-6 border-red-500/30 bg-red-500/5">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Паспорт не найден
          </h3>
          <p className="text-red-300 mb-4">
            {getErrorMessage(error)}
          </p>
          <p className="text-gray-400 text-sm">
            Обратитесь к администратору для создания паспорта
          </p>
        </div>
      </Card>
    );
  }

  if (!passport) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card variant="minecraft" className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 p-4 sm:p-6 border-b border-primary-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
              <div className="relative flex-shrink-0">
                {passport.nickname ? (
                  <MinecraftAvatar
                    nickname={passport.nickname}
                    size={64}
                    className="shadow-primary-glow sm:w-20 sm:h-20"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                )}
                {passport.is_emergency && (
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
                  {passport.first_name} {passport.last_name}
                </h2>
                {passport.nickname && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Gamepad2 className="h-3 w-3 sm:h-4 sm:w-4 text-accent-400" />
                    <p className="text-accent-400 font-medium text-sm sm:text-base truncate">
                      {passport.nickname}
                    </p>
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-400" />
                  <p className="text-gray-300 text-xs sm:text-sm truncate">
                    ID: {passport.discord_id}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end space-x-3 sm:space-x-0 sm:space-y-2">
              {passport.is_emergency && (
                <Badge variant="danger" size="sm">
                  В СПИСКЕ ЧС
                </Badge>
              )}
              {passport.bt_balance !== null && passport.bt_balance !== undefined && (
                <Badge variant="secondary" size="sm" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  <Coins className="h-3 w-3 mr-1" />
                  {passport.bt_balance} БТ
                </Badge>
              )}
              <div className="text-primary-300 text-xs sm:text-sm whitespace-nowrap">
                Паспорт №{passport.id}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">
                Личные данные
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary-400" />
                  <span className="text-gray-300 text-sm">Возраст:</span>
                  <span className="text-white font-medium">{passport.age} лет</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-primary-400" />
                  <span className="text-gray-300 text-sm">Пол:</span>
                  <span className="text-white font-medium">
                    {passport.gender === 'male' ? 'Мужской' : 'Женский'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">
                Место жительства
              </h3>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-secondary-400" />
                <span className="text-gray-300 text-sm">Город:</span>
                <span className="text-white font-medium">{passport.city}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">
                Правонарушения
              </h3>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-accent-400" />
                <span className="text-gray-300 text-sm">Всего нарушений:</span>
                <Badge 
                  variant={passport.violations_count > 0 ? "warning" : "success"}
                  size="sm"
                >
                  {passport.violations_count}
                </Badge>
              </div>
            </div>

            {/* Баллы труда */}
            {passport.bt_balance !== null && passport.bt_balance !== undefined && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Баллы труда
                </h3>
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-orange-400" />
                  <span className="text-gray-300 text-sm">Баланс:</span>
                  <Badge variant="secondary" size="sm" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    {passport.bt_balance} БТ
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Дополнительная информация */}
          <div className="border-t border-primary-500/30 pt-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-400">Дата въезда:</span>
                <span className="text-white ml-2">{formatDate(passport.entry_date)}</span>
              </div>
              <div>
                <span className="text-gray-400">Паспорт создан:</span>
                <span className="text-white ml-2">{formatDate(passport.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-400">Последнее обновление:</span>
                <span className="text-white ml-2">{formatDate(passport.updated_at)}</span>
              </div>
              {passport.uuid && (
                <div>
                  <span className="text-gray-400">UUID:</span>
                  <span className="text-white ml-2 font-mono text-xs">{passport.uuid}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default UserPassportCard;