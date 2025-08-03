import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  User,
  Loader2,
  Eye
} from 'lucide-react';
import { Modal, Button, Badge } from '@/components/ui';
import { Fine, Passport } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatMoney } from '@/utils';

interface PassportFinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: Passport | null;
}

const PassportFinesModal: React.FC<PassportFinesModalProps> = ({
  isOpen,
  onClose,
  passport
}) => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { execute: fetchFines } = useApi(apiService.getFines);

  useEffect(() => {
    if (isOpen && passport) {
      loadPassportFines();
    }
  }, [isOpen, passport]);

  const loadPassportFines = async () => {
    if (!passport) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Получаем штрафы по passport_id
      const finesData = await fetchFines(0, 100, passport.id);
      setFines(finesData || []);
    } catch (error) {
      console.error('Failed to load passport fines:', error);
      setLoadError('Ошибка загрузки штрафов');
    } finally {
      setIsLoading(false);
    }
  };

  if (!passport) return null;

  // Вычисляем статистику
  const paidFines = fines.filter(fine => fine.is_paid);
  const unpaidFines = fines.filter(fine => !fine.is_paid);
  const totalAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);
  const unpaidAmount = unpaidFines.reduce((sum, fine) => sum + fine.amount, 0);
  const paidAmount = paidFines.reduce((sum, fine) => sum + fine.amount, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Штрафы: ${passport.first_name} ${passport.last_name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Passport Info Header */}
        <div className="bg-dark-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-primary-400" />
            <div>
              <h3 className="text-lg font-medium text-white">
                {passport.first_name} {passport.last_name}
              </h3>
              <p className="text-sm text-gray-400">
                {passport.nickname ? `Ник: ${passport.nickname}` : `Discord: ${passport.discord_id}`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-primary-400" />
              <span className="text-sm text-gray-400">Всего штрафов</span>
            </div>
            <p className="text-xl font-bold text-white mt-1">{fines.length}</p>
          </div>
          <div className="bg-dark-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Оплачено</span>
            </div>
            <p className="text-xl font-bold text-green-400 mt-1">{paidFines.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatMoney(paidAmount)}
            </p>
          </div>
          <div className="bg-dark-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-400">Не оплачено</span>
            </div>
            <p className="text-xl font-bold text-red-400 mt-1">{unpaidFines.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatMoney(unpaidAmount)}
            </p>
          </div>
          <div className="bg-dark-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-gray-400">Общая сумма</span>
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {formatMoney(totalAmount)}
            </p>
          </div>
        </div>

        {/* Fines List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Receipt className="h-5 w-5 mr-2 text-primary-400" />
            Список штрафов
          </h3>
          
          {loadError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-400">{loadError}</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Загрузка штрафов...</span>
              </div>
            </div>
          ) : fines.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">У этого паспорта нет штрафов</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fines.map((fine, index) => (
                <motion.div
                  key={fine.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-dark-700/50 rounded-lg p-4 hover:bg-dark-700/70 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={fine.is_paid ? "success" : "danger"}
                          size="sm"
                        >
                          {fine.is_paid ? "Оплачен" : "Не оплачен"}
                        </Badge>
                        <span className="text-white font-medium">
                          {fine.article}
                        </span>
                        <span className="text-accent-400 font-bold">
                          {formatMoney(fine.amount)}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-sm">
                        {fine.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Выписан: {formatDate(fine.created_at, 'dd.MM.yyyy HH:mm')}</span>
                        </div>
                        {fine.paid_at && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span>Оплачен: {formatDate(fine.paid_at, 'dd.MM.yyyy HH:mm')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PassportFinesModal;