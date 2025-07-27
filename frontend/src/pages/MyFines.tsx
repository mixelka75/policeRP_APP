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
  Clock
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Badge, Button, Input, Loading } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';
import { Fine } from '@/types';
import { formatDate, formatMoney, getErrorMessage } from '@/utils';

const MyFines: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const totalAmount = fines?.reduce((sum, fine) => sum + fine.amount, 0) || 0;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="minecraft" className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-warning-500/20 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-warning-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Всего нарушений</p>
                  <p className="text-3xl font-bold text-white">
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
            <Card variant="minecraft" className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-danger-500/20 rounded-xl">
                  <DollarSign className="h-8 w-8 text-danger-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Общая сумма</p>
                  <p className="text-3xl font-bold text-white">
                    {formatMoney(totalAmount)}
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
            <Card variant="minecraft" className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-500/20 rounded-xl">
                  <Clock className="h-8 w-8 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Последний штраф</p>
                  <p className="text-lg font-medium text-white">
                    {fines && fines.length > 0 
                      ? formatDate(fines[0].created_at, 'dd.MM.yyyy')
                      : 'Нет штрафов'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Поиск и фильтры */}
        <Card variant="minecraft" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              История нарушений
            </h2>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Поиск по статье или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-64"
              />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Фильтры
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
                  <Card variant="glass" hover className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge 
                            variant="warning" 
                            className="flex items-center space-x-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span>Штраф #{fine.id}</span>
                          </Badge>
                          <div className="flex items-center space-x-1 text-gray-400 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(fine.created_at)}</span>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-2">
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

                      <div className="text-right ml-6">
                        <div className="text-2xl font-bold text-danger-400 mb-1">
                          {formatMoney(fine.amount)}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {formatDate(fine.updated_at, 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Пагинация (если понадобится) */}
          {filteredFines.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-primary-500/30">
              <p className="text-gray-400 text-sm">
                Показано {filteredFines.length} из {fines?.length || 0} штрафов
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
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