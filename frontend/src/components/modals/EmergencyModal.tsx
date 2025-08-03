// src/components/modals/EmergencyModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, MessageSquare, User } from 'lucide-react';
import { Passport, PassportEmergencyUpdate } from '@/types';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { getInitials, formatDate } from '@/utils';
import MinecraftAvatar from '@/components/common/MinecraftAvatar';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: Passport | null;
  onSuccess?: () => void;
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  passport,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { execute: updateEmergencyStatus, isLoading } = useApi(
    apiService.updatePassportEmergency,
    {
      showSuccessToast: true,
      onSuccess: (response) => {
        console.log(response.message);
        onSuccess?.();
        onClose();
        setReason('');
        setErrors({});
      },
    }
  );

  if (!passport) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация причины при добавлении в ЧС
    if (!passport.is_emergency && !reason.trim()) {
      setErrors({ reason: 'Укажите причину добавления в ЧС' });
      return;
    }

    const emergencyData: PassportEmergencyUpdate = {
      is_emergency: !passport.is_emergency,
      reason: reason.trim() || undefined,
    };

    try {
      await updateEmergencyStatus(passport.id, emergencyData);
    } catch (error) {
      // Error handling is done in the useApi hook
    }
  };

  const commonReasons = [
    'Нарушение общественного порядка',
    'Агрессивное поведение',
    'Неповиновение сотрудникам полиции',
    'Угроза безопасности',
    'Участие в незаконных акциях',
    'Нарушение ПДД',
    'Распространение наркотиков',
    'Другое'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={passport.is_emergency ? 'Убрать из ЧС' : 'Добавить в ЧС'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Информация о гражданине */}
        <div className="flex items-center space-x-4 p-4 bg-dark-700/50 rounded-lg">
          <MinecraftAvatar
            nickname={passport.nickname}
            size={64}
            shape="square"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {passport.first_name} {passport.last_name}
            </h3>
            <p className="text-dark-400">{passport.nickname}</p>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-dark-300">{passport.city}</span>
              <span className="text-sm text-dark-300">•</span>
              <span className="text-sm text-dark-300">{passport.age} лет</span>
              <span className="text-sm text-dark-300">•</span>
              <span className="text-sm text-dark-300">
                {passport.violations_count} нарушений
              </span>
            </div>
          </div>
          <div className="text-right">
            {passport.is_emergency ? (
              <Badge variant="danger" className="mb-2">
                В ЧС
              </Badge>
            ) : (
              <Badge variant="success" className="mb-2">
                Не в ЧС
              </Badge>
            )}
            <p className="text-xs text-dark-400">
              В городе с {formatDate(passport.entry_date, 'dd.MM.yyyy')}
            </p>
          </div>
        </div>

        {/* Основное действие */}
        <div className={`p-4 rounded-lg border ${
          passport.is_emergency 
            ? 'bg-primary-500/10 border-primary-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-center space-x-3 mb-3">
            {passport.is_emergency ? (
              <>
                <Shield className="h-6 w-6 text-primary-400" />
                <div>
                  <h4 className="font-medium text-primary-400">Убрать из списка ЧС</h4>
                  <p className="text-sm text-primary-300">
                    Гражданин будет исключен из списка чрезвычайных ситуаций
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <div>
                  <h4 className="font-medium text-red-400">Добавить в список ЧС</h4>
                  <p className="text-sm text-red-300">
                    Гражданин будет внесен в список чрезвычайных ситуаций
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Причина */}
        <div className="space-y-3">
          <Input
            label={passport.is_emergency ? 'Причина исключения (необязательно)' : 'Причина добавления в ЧС'}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errors.reason) {
                setErrors(prev => ({ ...prev, reason: '' }));
              }
            }}
            error={errors.reason}
            leftIcon={<MessageSquare className="h-4 w-4" />}
            placeholder={passport.is_emergency
              ? 'Укажите причину исключения...'
              : 'Укажите причину добавления в ЧС...'
            }
            disabled={isLoading}
            fullWidth
          />

          {/* Быстрые причины только для добавления в ЧС */}
          {!passport.is_emergency && (
            <div>
              <p className="text-sm text-dark-400 mb-2">Быстрый выбор причины:</p>
              <div className="flex flex-wrap gap-2">
                {commonReasons.map((commonReason, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setReason(commonReason)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1 bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white rounded-full transition-colors disabled:opacity-50"
                  >
                    {commonReason}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Предупреждение */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning-400" />
            <h4 className="font-medium text-warning-400">Внимание</h4>
          </div>
          <p className="text-sm text-warning-300">
            {passport.is_emergency
              ? 'Исключение из списка ЧС позволит гражданину свободно передвигаться по городу.'
              : 'Добавление в список ЧС ограничит возможности гражданина и будет зафиксировано в логах системы.'
            }
          </p>
        </motion.div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant={passport.is_emergency ? "success" : "danger"}
            loading={isLoading}
          >
            {passport.is_emergency ? 'Убрать из ЧС' : 'Добавить в ЧС'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmergencyModal;