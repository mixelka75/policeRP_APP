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
  Plus,
  MapPin,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { Passport, Fine } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Modal, Badge, Button, Card, Loading } from '@/components/ui';
import { FineForm } from '@/components/forms';
import { EmergencyModal } from '@/components/modals';
import { formatDate, formatMoney, getInitials } from '@/utils';

interface PassportDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  passport: Passport | null;
  onEdit?: (passport: Passport) => void;
  onRefresh?: () => void;
}

const PassportDetails: React.FC<PassportDetailsProps> = ({
  isOpen,
  onClose,
  passport,
  onEdit,
  onRefresh,
}) => {
  const [isFineFormOpen, setIsFineFormOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

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
    onRefresh?.(); // Обновляем данные в родительском компоненте
  };

  const handleEmergencyAction = () => {
    setIsEmergencyModalOpen(true);
  };

  const handleEmergencySuccess = () => {
    onRefresh?.(); // Обновляем данные в родительском компоненте
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
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                passport.is_emergency 
                  ? 'bg-gradient-to-br from-red-500 to-red-600' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                <span className="text-white font-bold text-lg">
                  {getInitials(passport.first_name, passport.last_name)}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-white">
                    {passport.first_name} {passport.last_name}
                  </h2>
                  {passport.is_emergency && (
                    <Badge variant="danger">
                      ЧС
                    </Badge>
                  )}
                </div>
                <p className="text-dark-400">{passport.nickname}</p>
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
                variant={passport.is_emergency ? "success" : "danger"}
                size="sm"
                onClick={handleEmergencyAction}
                leftIcon={passport.is_emergency ? <Shield className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              >
                {passport.is_emergency ? 'Убрать из ЧС' : 'Добавить в ЧС'}
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

          {/* ✨ ОБНОВЛЕННАЯ основная информация с новыми полями */}
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
              {/* ✨ НОВОЕ ПОЛЕ: Город */}
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-dark-400">Город проживания</p>
                  <p className="text-lg font-medium text-white">{passport.city}</p>
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
              {/* ✨ НОВОЕ ПОЛЕ: Дата въезда */}
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-dark-400">Въезд в город</p>
                  <p className="text-lg font-medium text-white">
                    {formatDate(passport.entry_date)}
                  </p>
                </div>
              </div>
              {/* ✨ НОВОЕ ПОЛЕ: Количество нарушений */}
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`h-5 w-5 ${passport.violations_count > 0 ? 'text-red-400' : 'text-green-400'}`} />
                <div>
                  <p className="text-sm text-dark-400">Нарушений</p>
                  <p className={`text-lg font-medium ${passport.violations_count > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {passport.violations_count}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* ✨ НОВЫЙ блок предупреждения о ЧС */}
          {passport.is_emergency && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3 mb-2">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h4 className="font-medium text-red-400">Внимание: Статус ЧС</h4>
              </div>
              <p className="text-red-300 text-sm">
                Данный гражданин находится в списке чрезвычайных ситуаций.
                Будьте осторожны при взаимодействии и следуйте установленным протоколам.
              </p>
            </motion.div>
          )}

          {/* Статистика штрафов */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                История штрафов
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
                <p className="text-dark-400 mb-4">Штрафов нет</p>
                <Button
                  variant="primary"
                  onClick={handleCreateFine}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Выписать первый штраф
                </Button>
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

          {/* ✨ НОВАЯ секция: Дополнительная информация */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-400" />
              Дополнительная информация
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-400">Время в системе:</p>
                <p className="text-dark-200">
                  {Math.ceil((new Date().getTime() - new Date(passport.created_at).getTime()) / (1000 * 60 * 60 * 24))} дней
                </p>
              </div>
              <div>
                <p className="text-dark-400">Время в городе:</p>
                <p className="text-dark-200">
                  {Math.ceil((new Date().getTime() - new Date(passport.entry_date).getTime()) / (1000 * 60 * 60 * 24))} дней
                </p>
              </div>
              <div>
                <p className="text-dark-400">Последнее обновление:</p>
                <p className="text-dark-200">{formatDate(passport.updated_at)}</p>
              </div>
              <div>
                <p className="text-dark-400">Статус безопасности:</p>
                <div className="flex items-center space-x-2">
                  {passport.is_emergency ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-400">Повышенная опасность</span>
                    </>
                  ) : passport.violations_count > 5 ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-400">Требует внимания</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400">Обычный</span>
                    </>
                  )}
                </div>
              </div>
            </div>
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

      {/* Emergency Management Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        passport={passport}
        onSuccess={handleEmergencySuccess}
      />
    </>
  );
};

export default PassportDetails;