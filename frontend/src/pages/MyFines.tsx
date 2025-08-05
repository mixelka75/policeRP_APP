// src/pages/MyFines.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  User,
  Search,
  Filter,
  ExternalLink,
  Clock,
  CreditCard,
  Check,
  X
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Badge, Button, Input, Loading } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';
import { Fine } from '@/types';
import { formatDate, formatMoney, getErrorMessage } from '@/utils';

const MyFines: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFines, setSelectedFines] = useState<number[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const {
    data: fines,
    isLoading,
    error,
    execute: fetchMyFines,
  } = useApi(apiService.getMyFines, {
    showErrorToast: false,
  });

  useEffect(() => {
    fetchMyFines();
  }, []);

  const filteredFines = fines?.filter(fine =>
    fine.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fine.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const unpaidFines = filteredFines.filter(fine => !fine.is_paid);
  const totalAmount = fines?.reduce((sum, fine) => sum + fine.amount, 0) || 0;
  const unpaidAmount = unpaidFines.reduce((sum, fine) => sum + fine.amount, 0);
  const selectedAmount = unpaidFines
    .filter(fine => selectedFines.includes(fine.id))
    .reduce((sum, fine) => sum + fine.amount, 0);

  const handleSelectFine = (fineId: number) => {
    setSelectedFines(prev => 
      prev.includes(fineId) 
        ? prev.filter(id => id !== fineId)
        : [...prev, fineId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFines.length === unpaidFines.length) {
      setSelectedFines([]);
    } else {
      setSelectedFines(unpaidFines.map(fine => fine.id));
    }
  };

  const handlePayment = async (fineIds: number[]) => {
    if (fineIds.length === 0) return;

    setPaymentLoading(true);
    try {
      // Получаем паспорт пользователя
      const passport = await apiService.getMyPassport();
      
      // Создаём платеж
      const payment = await apiService.createPayment({
        passport_id: passport.id,
        fine_ids: fineIds
      });

      // Открываем ссылку на оплату в новой вкладке
      if (payment.payment_url) {
        window.open(payment.payment_url, '_blank');
      }

      // Сбрасываем выбор
      setSelectedFines([]);
    } catch (error) {
      console.error('Payment creation failed:', error);
      // Здесь можно добавить toast уведомление об ошибке
    } finally {
      setPaymentLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Загрузка штрафов..." />;
  }

  return (
    <Layout
      title="Мои штрафы"
      subtitle="Список ваших нарушений и штрафов"
    >
      <div className="space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="minecraft" className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-warning-500/20 rounded-xl">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-warning-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Всего штрафов</p>
                  <p className="text-xl sm:text-3xl font-bold text-white">
                    {fines?.length || 0}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="minecraft" className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-danger-500/20 rounded-xl">
                  <X className="h-6 w-6 sm:h-8 sm:w-8 text-danger-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Неоплачено</p>
                  <p className="text-xl sm:text-3xl font-bold text-danger-400">
                    {unpaidFines.length}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="minecraft" className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-success-500/20 rounded-xl">
                  <Check className="h-6 w-6 sm:h-8 sm:w-8 text-success-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Оплачено</p>
                  <p className="text-xl sm:text-3xl font-bold text-success-400">
                    {(fines?.length || 0) - unpaidFines.length}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="minecraft" className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-primary-500/20 rounded-xl">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">К доплате</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {formatMoney(unpaidAmount)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Панель оплаты штрафов */}
        {unpaidFines.length > 0 && (
          <Card variant="minecraft" className="p-4 sm:p-6 border-orange-500/30">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-orange-500/20 rounded-xl flex-shrink-0">
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                    Оплата штрафов
                  </h3>
                  <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-400">
                    <span>Выбрано: {selectedFines.length} штрафов</span>
                    {selectedFines.length > 0 && (
                      <span className="text-orange-400 font-medium">
                        К оплате: {formatMoney(selectedAmount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={paymentLoading}
                  className="w-full sm:w-auto"
                >
                  <span className="sm:hidden">{selectedFines.length === unpaidFines.length ? 'Снять' : 'Выбрать'}</span>
                  <span className="hidden sm:inline">{selectedFines.length === unpaidFines.length ? 'Снять все' : 'Выбрать все'}</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CreditCard className="h-4 w-4" />}
                  onClick={() => handlePayment(selectedFines)}
                  disabled={selectedFines.length === 0 || paymentLoading}
                  loading={paymentLoading}
                  className="w-full sm:w-auto"
                >
                  <span className="sm:hidden">Оплатить</span>
                  <span className="hidden sm:inline">Оплатить выбранные</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Поиск и фильтры */}
        <Card variant="minecraft" className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              История нарушений
            </h2>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <Input
                placeholder="Поиск по статье или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full sm:w-64"
              />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                <span className="sm:hidden">Фильтры</span>
                <span className="hidden sm:inline">Фильтры</span>
              </Button>
            </div>
          </div>

          {/* Список штрафов */}
          {error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Ошибка загрузки
              </h3>
              <p className="text-red-300 mb-4">
                {getErrorMessage(error)}
              </p>
              <Button
                onClick={() => fetchMyFines()}
                variant="outline"
                leftIcon={<ExternalLink className="h-4 w-4" />}
              >
                Попробовать снова
              </Button>
            </div>
          ) : filteredFines.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                {searchTerm ? 'Штрафы не найдены' : 'У вас нет штрафов'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Соблюдайте правила дорожного движения!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFines.map((fine, index) => (
                <motion.div
                  key={fine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    variant="glass" 
                    hover 
                    className={`p-4 sm:p-6 ${fine.is_paid ? 'opacity-60' : ''} ${
                      !fine.is_paid && selectedFines.includes(fine.id) ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                        {/* Чекбокс для неоплаченных штрафов */}
                        {!fine.is_paid && (
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selectedFines.includes(fine.id)}
                              onChange={() => handleSelectFine(fine.id)}
                              className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge 
                              variant={fine.is_paid ? "success" : "warning"}
                              className="flex items-center space-x-1"
                            >
                              {fine.is_paid ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              <span>Штраф #{fine.id}</span>
                            </Badge>
                            {fine.is_paid && (
                              <Badge variant="success" className="text-xs">
                                Оплачено
                              </Badge>
                            )}
                            <div className="flex items-center space-x-1 text-gray-400 text-sm">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(fine.created_at)}</span>
                            </div>
                          </div>

                          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                            {fine.article}
                          </h3>

                          {fine.description && (
                            <p className="text-gray-300 mb-3">
                              {fine.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1 text-gray-400">
                              <User className="h-4 w-4" />
                              <span>Выписал: Сотрудник #{fine.created_by_user_id}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between sm:flex-col sm:text-right sm:ml-6 sm:items-end">
                        <div>
                          <div className={`text-xl sm:text-2xl font-bold mb-1 ${
                            fine.is_paid ? 'text-success-400' : 'text-danger-400'
                          }`}>
                            {formatMoney(fine.amount)}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatDate(fine.updated_at, 'HH:mm')}
                          </div>
                        </div>
                        {!fine.is_paid && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-0 sm:mt-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                            leftIcon={<CreditCard className="h-4 w-4" />}
                            onClick={() => handlePayment([fine.id])}
                            disabled={paymentLoading}
                            glow
                          >
                            Оплатить
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Пагинация (если понадобится) */}
          {filteredFines.length > 0 && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mt-6 pt-6 border-t border-primary-500/30">
              <p className="text-gray-400 text-sm">
                Показано {filteredFines.length} из {fines?.length || 0} штрафов
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="w-full sm:w-auto"
                >
                  Сбросить поиск
                </Button>
              )}
            </div>
          )}
        </Card>


      </div>
    </Layout>
  );
};

export default MyFines;