// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  AlertTriangle,
  Activity,
  Plus,
  Search,
  Filter,
  Eye,
  Edit
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Passport, Fine } from '@/types';
import { Button, Loading, Input } from '@/components/ui';
import { Layout } from '@/components/layout';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { PassportForm, FineForm } from '@/components/forms';
import { formatDate, formatMoney } from '@/utils';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fines' | 'passports'>('fines');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPassportFormOpen, setIsPassportFormOpen] = useState(false);
  const [isFineFormOpen, setIsFineFormOpen] = useState(false);

  // API hooks с правильным использованием
  const {
    data: passports,
    isLoading: passportsLoading,
    execute: fetchPassports,
    error: passportsError,
  } = useApi(apiService.getPassports);

  const {
    data: fines,
    isLoading: finesLoading,
    execute: fetchFines,
    error: finesError,
  } = useApi(apiService.getFines);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPassports(),
          fetchFines()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, []);

  const filteredPassports = passports?.filter(passport =>
    passport.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredFines = fines?.filter(fine =>
    fine.article.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = [
    {
      title: 'Всего паспортов',
      value: passports?.length || 0,
      icon: Users,
      color: 'blue' as const,
    },
    {
      title: 'Всего штрафов',
      value: fines?.length || 0,
      icon: FileText,
      color: 'green' as const,
    },
    {
      title: 'Сумма штрафов',
      value: formatMoney(fines?.reduce((sum, fine) => sum + fine.amount, 0) || 0),
      icon: AlertTriangle,
      color: 'red' as const,
    },
  ];

  const tabs = [
    { id: 'fines', label: 'Штрафы', icon: AlertTriangle },
    { id: 'passports', label: 'Паспорта', icon: Users },
  ];

  // Обработчики событий
  const handleCreateClick = () => {
    if (activeTab === 'fines') {
      setIsFineFormOpen(true);
    } else {
      setIsPassportFormOpen(true);
    }
  };

  const handleNavigateToPassports = () => {
    navigate('/passports');
  };

  const handleNavigateToFines = () => {
    navigate('/fines');
  };

  const handleFormSuccess = () => {
    // Перезагружаем данные после успешного создания
    fetchPassports();
    fetchFines();
  };

  // Показываем лоадер только если загружаются оба ресурса
  if (passportsLoading && finesLoading) {
    return <Loading fullScreen text="Загрузка данных..." />;
  }

  // Показываем ошибку если есть критические ошибки
  if (passportsError && finesError) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Ошибка загрузки данных</h2>
          <p className="text-dark-400 mb-4">
            Не удалось загрузить данные с сервера
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
          >
            Обновить страницу
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <Layout
      title="Главная"
      subtitle="Обзор системы"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Card className="min-h-[600px]">
          {/* Tabs */}
          <div className="border-b border-dark-600 mb-6">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'fines' | 'passports')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-dark-400 hover:text-dark-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-64"
              />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="h-4 w-4" />}
                onClick={() => console.log('Filter clicked')}
              >
                Фильтры
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleCreateClick}
              >
                Добавить {activeTab === 'fines' ? 'штраф' : 'паспорт'}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {activeTab === 'fines' && (
              <div className="space-y-4">
                {finesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loading text="Загрузка штрафов..." />
                  </div>
                ) : filteredFines.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                    <p className="text-dark-400 mb-4">
                      {searchTerm ? 'Штрафы не найдены' : 'Штрафов пока нет'}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="primary"
                        onClick={() => setIsFineFormOpen(true)}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Создать первый штраф
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-dark-400">Показано {filteredFines.length} штрафов</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigateToFines}
                      >
                        Посмотреть все штрафы
                      </Button>
                    </div>
                    {filteredFines.slice(0, 5).map((fine, index) => (
                      <motion.div
                        key={fine.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card hover className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-lg font-medium text-white truncate">
                                    {fine.article}
                                  </h3>
                                  <p className="text-sm text-dark-400 mb-1">
                                    Паспорт ID: {fine.passport_id}
                                  </p>
                                  <p className="text-xs text-dark-500">
                                    {formatDate(fine.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-red-400">
                                  {formatMoney(fine.amount)}
                                </p>
                                <p className="text-xs text-dark-400">
                                  Штраф
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!p-2"
                                  onClick={() => navigate(`/fines`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!p-2"
                                  onClick={() => navigate(`/fines`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeTab === 'passports' && (
              <div className="space-y-4">
                {passportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loading text="Загрузка паспортов..." />
                  </div>
                ) : filteredPassports.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                    <p className="text-dark-400 mb-4">
                      {searchTerm ? 'Паспорта не найдены' : 'Паспортов пока нет'}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="primary"
                        onClick={() => setIsPassportFormOpen(true)}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Создать первый паспорт
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-dark-400">Показано {filteredPassports.length} паспортов</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigateToPassports}
                      >
                        Посмотреть все паспорта
                      </Button>
                    </div>
                    {filteredPassports.slice(0, 5).map((passport, index) => (
                      <motion.div
                        key={passport.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card hover className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-400" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-lg font-medium text-white truncate">
                                    {passport.first_name} {passport.last_name}
                                  </h3>
                                  <p className="text-sm text-dark-400 mb-1">
                                    {passport.nickname}
                                  </p>
                                  <p className="text-xs text-dark-500">
                                    {formatDate(passport.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-400">
                                  {passport.age}
                                </p>
                                <p className="text-xs text-dark-400">
                                  лет
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!p-2"
                                  onClick={() => navigate(`/passports`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!p-2"
                                  onClick={() => navigate(`/passports`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Forms */}
      <PassportForm
        isOpen={isPassportFormOpen}
        onClose={() => setIsPassportFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <FineForm
        isOpen={isFineFormOpen}
        onClose={() => setIsFineFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Layout>
  );
};

export default Dashboard;