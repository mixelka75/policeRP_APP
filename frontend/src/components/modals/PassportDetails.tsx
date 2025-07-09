// src/components/modals/PassportDetails.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  Users,
  AlertTriangle,
  FileText,
  Clock,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { Passport, Fine } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Modal, Badge, Button, Card, Loading } from '@/components/ui';
import { FineForm } from '@/components/forms';
import { formatDate, formatMoney, getInitials } from '@/utils';

interface PassportDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  passport: Passport | null;
  onEdit?: (passport: Passport) => void;
}

const PassportDetails: React.FC<PassportDetailsProps> = ({
  isOpen,
  onClose,
  passport,
  onEdit,
}) => {
  const [isFineFormOpen, setIsFineFormOpen] = useState(false);

  const {
    data: fines,
    isLoading: finesLoading,
    execute: fetchFines,
  } = useApi(apiService.getFines);

  useEffect(() => {
    if (isOpen && passport) {
      fetchFines(0, 100, passport.id);
    }
  }, [isOpen, passport]);

  if (!passport) return null;

  const passportFines = fines?.filter(fine => fine.passport_id === passport.id) || [];
  const totalFines = passportFines.reduce((sum, fine) => sum + fine.amount, 0);

  const handleCreateFine = () => {
    setIsFineFormOpen(true);
  };

  const handleFineSuccess = () => {
    fetchFines(0, 100, passport.id);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Детали паспорта"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {getInitials(passport.first_name, passport.last_name)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {passport.first_name} {passport.last_name}
                </h2>
                <p className="text-dark-400">@{passport.nickname}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(passport)}
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Редактировать
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCreateFine}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Выписать штраф
              </Button>
            </div>
          </div>

          {/* Basic Info */}
          <Card className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-dark-400">Возраст</p>
                  <p className="text-lg font-medium text-white">{passport.age} лет</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-dark-400">Пол</p>
                  <p className="text-lg font-medium text-white">
                    {passport.gender === 'male' ? 'Мужской' : 'Женский'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-dark-400">Дата создания</p>
                  <p className="text-lg font-medium text-white">
                    {formatDate(passport.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-dark-400">Последнее обновление</p>
                  <p className="text-lg font-medium text-white">
                    {formatDate(passport.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Fines Summary */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                Штрафы
              </h3>
              <div className="flex items-center space-x-4">
                <Badge variant="danger">
                  {passportFines.length} штрафов
                </Badge>
                <Badge variant="warning">
                  {formatMoney(totalFines)}
                </Badge>
              </div>
            </div>

            {finesLoading ? (
              <Loading text="Загрузка штрафов..." />
            ) : passportFines.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                <p className="text-dark-400">Штрафов нет</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {passportFines.map((fine, index) => (
                  <motion.div
                    key={fine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-dark-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white truncate">
                              {fine.article}
                            </p>
                            <p className="text-sm text-dark-400">
                              {formatDate(fine.created_at)}
                            </p>
                          </div>
                        </div>
                        {fine.description && (
                          <p className="text-sm text-dark-300 mt-2 ml-11">
                            {fine.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-400">
                          {formatMoney(fine.amount)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Modal>

      {/* Fine Form Modal */}
      <FineForm
        isOpen={isFineFormOpen}
        onClose={() => setIsFineFormOpen(false)}
        selectedPassportId={passport.id}
        onSuccess={handleFineSuccess}
      />
    </>
  );
};

export default PassportDetails;