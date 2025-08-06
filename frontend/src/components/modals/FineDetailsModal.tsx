// src/components/modals/FineDetailsModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Fine, Passport } from '@/types';
import { formatDate, formatMoney } from '@/utils';
import { Modal } from '@/components/ui';
import MinecraftAvatar from '@/components/common/MinecraftAvatar';

interface FineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fine: Fine | null;
  passport: Passport | null;
}

const FineDetailsModal: React.FC<FineDetailsModalProps> = ({
  isOpen,
  onClose,
  fine,
  passport,
}) => {
  if (!fine) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Детали штрафа"
      size="md"
    >
      <div className="space-y-6">
        {/* Гражданин */}
        {passport && (
          <div className="bg-dark-800/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Гражданин
            </h3>
            <div className="flex items-center space-x-4">
              <MinecraftAvatar
                nickname={passport.nickname}
                size={48}
                shape="square"
              />
              <div>
                <p className="font-medium text-white">
                  {passport.first_name} {passport.last_name}
                </p>
                <p className="text-sm text-gray-400">{passport.nickname}</p>
                <p className="text-xs text-gray-500">
                  {passport.age} лет • {passport.gender} • {passport.city}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Основная информация */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Статья */}
          <div className="bg-dark-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Статья
              </h3>
            </div>
            <p className="font-medium text-white">{fine.article}</p>
          </div>

          {/* Сумма */}
          <div className="bg-dark-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Сумма штрафа
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-red-400">
                {formatMoney(fine.amount)}
              </span>
              {fine.is_paid ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Статус оплаты */}
        <div className="bg-dark-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Статус
          </h3>
          {fine.is_paid ? (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">Штраф оплачен</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-medium">Требует оплаты</span>
            </div>
          )}
        </div>

        {/* Описание */}
        {fine.description && (
          <div className="bg-dark-800/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Описание нарушения
            </h3>
            <p className="text-gray-300 leading-relaxed">{fine.description}</p>
          </div>
        )}

        {/* Дополнительная информация */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Выписал */}
          {fine.issuer_info && (
            <div className="bg-dark-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Выписал штраф
                </h3>
              </div>
              <div>
                <p className="font-medium text-white">
                  {fine.issuer_info.minecraft_username || fine.issuer_info.discord_username}
                </p>
                {fine.issuer_info.minecraft_username && fine.issuer_info.discord_username && (
                  <p className="text-sm text-gray-400">
                    Discord: {fine.issuer_info.discord_username}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Дата выписки */}
          <div className="bg-dark-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Дата выписки
              </h3>
            </div>
            <p className="font-medium text-white">{formatDate(fine.created_at)}</p>
          </div>
        </div>

        {/* Дата платежа - если есть в будущем */}
        {fine.is_paid && (fine as any).payment_date && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-medium text-green-400 uppercase tracking-wider">
                Дата оплаты
              </h3>
            </div>
            <p className="font-medium text-green-400">{formatDate((fine as any).payment_date)}</p>
          </div>
        )}

        {/* Кнопка закрытия */}
        <div className="flex justify-end pt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Закрыть
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default FineDetailsModal;