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
  Edit,
  ShieldAlert,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Passport, Fine } from '@/types';
import { Button, Loading, Input, Badge, Card } from '@/components/ui';
import { Layout } from '@/components/layout';
import StatCard from '@/components/ui/StatCard';
import { PassportForm, FineForm } from '@/components/forms';
import { formatDate, formatMoney, getInitials } from '@/utils';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fines' | 'passports' | 'emergency'>('emergency'); // ✨ Добавлена вкладка ЧС
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

  // ✨ НОВЫЙ хук для получения списка ЧС
  const {
    data: emergencyPassports,
    isLoading: emergencyLoading,
    execute: fetchEmergencyPassports,
  } = useApi(apiService.getEmergencyPassports);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPassports(),
          fetchFines(),
          fetchEmergencyPassports() // ✨ НОВЫЙ вызов
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
    passport.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.city.toLowerCase().includes(searchTerm.toLowerCase()) // ✨ Поиск по городу
  ) || [];

  const filteredFines = fines?.filter(fine =>
    fine.article.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredEmergencyPassports = emergencyPassports?.filter(passport =>
    passport.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.city.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // ✨ ОБНОВЛЕННАЯ статистика
  const stats = [
    {
      title: 'Всего паспортов',
      value: passports?.length || 0,
      icon: Users,
      color: 'blue' as const,
    },
    {
      title: 'В списке ЧС',
      value: emergencyPassports?.length || 0,
      icon: ShieldAlert,
      color: 'red' as const,
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
      color: 'yellow' as const,
    },
  ];

  // ✨ ОБНОВЛЕННЫЕ вкладки
  const tabs = [
    { id: 'emergency', label: 'ЧС', icon: ShieldAlert },
    { id: 'fines', label: 'Штрафы', icon: AlertTriangle },
    { id: 'passports', label: 'Паспорта', icon: Users },
  ];

  // Обработчики событий
  const handleCreateClick = () => {
    if (activeTab === 'fines') {
      setIsFineFormOpen(true);
    } else if (activeTab === 'passports') {
      setIsPassportFormOpen(true);
    } else {
      // Для ЧС перенаправляем на страницу управления
      navigate('/emergency');
    }
  };

  const handleNavigateToPassports = () => {
    navigate('/passports');
  };

  const handleNavigateToFines = () => {
    navigate('/fines');
  };

  const handleNavigateToEmergency = () => {
    navigate('/emergency');
  };

  const handleFormSuccess = () => {
    // Перезагружаем данные после успешного создания
    fetchPassports();
    fetchFines();
    fetchEmergencyPassports();
  };

  // Показываем лоадер только если загружаются основные ресурсы
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

        {/* ✨ НОВЫЙ блок предупреждения о ЧС */}
        {emergencyPassports && emergencyPassports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-red-500/10 border-red-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-400">
                      Активные чрезвычайные ситуации
                    </h3>
                    <p className="text-red-300">
                      В системе зарегистрировано <strong>{emergencyPassports.length}</strong> человек в списке ЧС
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigateToEmergency}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Управлять
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <Card className="min-h-[600px]">
          {/* Tabs */}
          <div className="border-b border-dark-600 mb-6">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-dark-400 hover:text-dark-300'
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${
                    // ✨ Специальная подсветка для ЧС
                    tab.id === 'emergency' ? 'text-red-400' : ''
                  }`} />
                  <span>{tab.label}</span>
                  {/* ✨ Счетчик для ЧС */}
                  {tab.id === 'emergency' && emergencyPassports && emergencyPassports.length > 0 && (
                    <Badge variant="danger" size="sm">
                      {emergencyPassports.length}
                    </Badge>
                  )}
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
                variant={activeTab === 'emergency' ? 'danger' : 'primary'}
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleCreateClick}
              >
                {activeTab === 'emergency'
                  ? 'Управлять ЧС'
                  : `Добавить ${activeTab === 'fines' ? 'штраф' : 'паспорт'}`
                }
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* ✨ НОВАЯ вкладка ЧС */}
            {activeTab === 'emergency' && (
              <div className="space-y-4">
                {emergencyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loading text="Загрузка списка ЧС..." />
                  </div>
                ) : filteredEmergencyPassports.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldAlert className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                    <p className="text-dark-400 mb-4">
                      {searchTerm ? 'Паспорта в ЧС не найдены' : 'В списке ЧС никого нет'}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="outline"
                        onClick={handleNavigateToEmergency}
                        leftIcon={<ShieldAlert className="h-4 w-4" />}
                      >
                        Перейти к управлению ЧС
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-dark-400">Показано {filteredEmergencyPassports.length} записей в ЧС</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigateToEmergency}
                      >
                        Управлять всеми ЧС
                      </Button>
                    </div>
                    {filteredEmergencyPassports.slice(0, 5).map((passport, index) => (
                      <motion.div
                        key={passport.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card hover className="p-4 bg-red-500/5 border-red-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <ShieldAlert className="h-6 w-6 text-red-400" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-medium text-white truncate">
                                      {passport.first_name} {passport.last_name}
                                    </h3>
                                    <Badge variant="danger" size="sm">ЧС</Badge>
                                  </div>
                                  <p className="text-sm text-dark-400 mb-1">
                                    {passport.nickname} • {passport.city}
                                  </p>
                                  <p className="text-xs text-dark-500">
                                    {passport.violations_count} нарушений • В городе с {formatDate(passport.entry_date, 'dd.MM.yyyy')}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-red-400">
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
                                  onClick={() => navigate(`/emergency`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!p-2"
                                  onClick={() => navigate(`/emergency`)}
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

            {/* Существующие вкладки штрафов и паспортов остаются без изменений */}
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
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    passport.is_emergency 
                                      ? 'bg-red-500/20' 
                                      : 'bg-blue-500/20'
                                  }`}>
                                    {passport.is_emergency ? (
                                      <ShieldAlert className="h-6 w-6 text-red-400" />
                                    ) : (
                                      <Users className="h-6 w-6 text-blue-400" />
                                    )}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-medium text-white truncate">
                                      {passport.first_name} {passport.last_name}
                                    </h3>
                                    {passport.is_emergency && (
                                      <Badge variant="danger" size="sm">ЧС</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-dark-400 mb-1">
                                    {passport.nickname} • {passport.city}
                                  </p>
                                  <p className="text-xs text-dark-500">
                                    {passport.violations_count} нарушений • {formatDate(passport.created_at)}
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