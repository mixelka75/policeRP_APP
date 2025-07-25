// src/pages/Dashboard.tsx - Обновленный с новой цветовой схемой
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
  TrendingUp,
  MessageCircle,
  RefreshCw,
  UserCheck,
  Clock,
  Gamepad2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Passport, Fine } from '@/types';
import { Button, Loading, Input, Badge, Card } from '@/components/ui';
import { Layout } from '@/components/layout';
import UserAvatar from '@/components/common/UserAvatar';
import StatCard from '@/components/ui/StatCard';
import { PassportForm, FineForm } from '@/components/forms';
import {
  formatDate,
  formatMoney,
  getDisplayName,
  getRoleDisplayName,
  isUserDataOutdated
} from '@/utils';

const Dashboard: React.FC = () => {
  const { user, refreshUserData } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fines' | 'passports' | 'emergency'>('emergency');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPassportFormOpen, setIsPassportFormOpen] = useState(false);
  const [isFineFormOpen, setIsFineFormOpen] = useState(false);

  const {
    data: passports,
    isLoading: passportsLoading,
    execute: fetchPassports,
    error: passportsError,
  } = useApi(apiService.getPassports, {
    showErrorToast: false,
  });

  const {
    data: fines,
    isLoading: finesLoading,
    execute: fetchFines,
    error: finesError,
  } = useApi(apiService.getFines, {
    showErrorToast: false,
  });

  const {
    data: emergencyPassports,
    isLoading: emergencyLoading,
    execute: fetchEmergencyPassports,
    error: emergencyError,
  } = useApi(apiService.getEmergencyPassports, {
    showErrorToast: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPassports(),
          fetchFines(),
          fetchEmergencyPassports()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'SESSION_EXPIRED') {
          return;
        }
      }
    };

    loadData();
  }, []);

  const filteredPassports = passports?.filter(passport =>
    passport.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.city.toLowerCase().includes(searchTerm.toLowerCase())
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

  // ✨ ОБНОВЛЕННАЯ статистика с новыми цветами
  const stats = [
    {
      title: 'Всего паспортов',
      value: passports?.length || 0,
      icon: Users,
      color: 'primary' as const, // было 'blue'
    },
    {
      title: 'В списке ЧС',
      value: emergencyPassports?.length || 0,
      icon: ShieldAlert,
      color: 'danger' as const, // остается красный
    },
    {
      title: 'Всего штрафов',
      value: fines?.length || 0,
      icon: FileText,
      color: 'secondary' as const, // было 'green'
    },
    {
      title: 'Сумма штрафов',
      value: formatMoney(fines?.reduce((sum, fine) => sum + fine.amount, 0) || 0),
      icon: AlertTriangle,
      color: 'accent' as const, // было 'yellow'
    },
  ];

  const tabs = [
    { id: 'emergency', label: 'ЧС', icon: ShieldAlert },
    { id: 'fines', label: 'Штрафы', icon: AlertTriangle },
    { id: 'passports', label: 'Паспорта', icon: Users },
  ];

  const handleCreateClick = () => {
    if (activeTab === 'fines') {
      setIsFineFormOpen(true);
    } else if (activeTab === 'passports') {
      setIsPassportFormOpen(true);
    } else {
      navigate('/emergency');
    }
  };

  const handleFormSuccess = () => {
    fetchPassports();
    fetchFines();
    fetchEmergencyPassports();
  };

  const handleUserDataRefresh = async () => {
    if (user) {
      await refreshUserData();
    }
  };

  const isInitialLoading = passportsLoading && finesLoading && emergencyLoading;

  if (isInitialLoading) {
    return <Loading fullScreen text="Загрузка данных..." />;
  }

  const hasCriticalError = (passportsError || finesError || emergencyError) &&
    !(passportsError && typeof passportsError === 'string' && passportsError.includes('Сессия истекла')) &&
    !(finesError && typeof finesError === 'string' && finesError.includes('Сессия истекла')) &&
    !(emergencyError && typeof emergencyError === 'string' && emergencyError.includes('Сессия истекла'));

  if (hasCriticalError) {
    return (
      <div className="min-h-screen bg-minecraft-dark flex items-center justify-center">
        <Card variant="minecraft" className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Ошибка загрузки данных</h2>
          <p className="text-gray-300 mb-4">
            Не удалось загрузить данные с сервера
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="minecraft"
            glow
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
        {/* ✨ ОБНОВЛЕННЫЙ User Info Banner с новыми цветами */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="minecraft" className="overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <UserAvatar
                      user={user}
                      size={64}
                      showStatus={true}
                      className="shadow-primary-glow animate-glow"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-bold text-white">
                        Добро пожаловать, {getDisplayName(user)}!
                      </h3>
                      <MessageCircle className="h-6 w-6 text-secondary-400" /> {/* ✨ НОВЫЙ цвет */}
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-primary-300 font-medium"> {/* ✨ НОВЫЙ цвет */}
                        {getRoleDisplayName(user.role)}
                      </p>
                      {user.minecraft_username && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center space-x-1">
                            <Gamepad2 className="h-4 w-4 text-accent-400" /> {/* ✨ НОВЫЙ цвет */}
                            <p className="text-accent-400"> {/* ✨ НОВЫЙ цвет */}
                              {user.minecraft_username}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Последняя проверка: {formatDate(user.last_role_check)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {isUserDataOutdated(user) && (
                    <Badge variant="warning">
                      Данные устарели
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUserDataRefresh}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Обновить данные
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ✨ ОБНОВЛЕННАЯ статистика */}
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

        {/* ✨ ОБНОВЛЕННОЕ Emergency Warning с новыми цветами */}
        {emergencyPassports && emergencyPassports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="minecraft" className="border-red-500/30 bg-red-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-red-400 animate-pulse" />
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
                  variant="danger"
                  size="sm"
                  onClick={() => navigate('/emergency')}
                  glow
                >
                  Управлять
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ✨ ОБНОВЛЕННЫЙ Main Content с новыми цветами */}
        <Card variant="minecraft" className="min-h-[600px]">
          {/* ✨ ОБНОВЛЕННЫЕ Tabs с новыми цветами */}
          <div className="border-b border-primary-500/30 mb-6"> {/* ✨ НОВЫЙ цвет границы */}
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-400' // ✨ НОВЫЕ цвета активной вкладки
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${
                    tab.id === 'emergency' ? 'text-red-400' : ''
                  }`} />
                  <span>{tab.label}</span>
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
                className="w-64 minecraft-input"
              />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Фильтры
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={activeTab === 'emergency' ? 'danger' : 'minecraft'}
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleCreateClick}
                glow
              >
                {activeTab === 'emergency'
                  ? 'Управлять ЧС'
                  : `Добавить ${activeTab === 'fines' ? 'штраф' : 'паспорт'}`
                }
              </Button>
            </div>
          </div>

          {/* Content остается тем же... */}
          <div className="space-y-4">
            {/* Emergency Tab */}
            {activeTab === 'emergency' && (
              <div className="space-y-4">
                {emergencyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loading text="Загрузка списка ЧС..." />
                  </div>
                ) : filteredEmergencyPassports.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldAlert className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">
                      {searchTerm ? 'Паспорта в ЧС не найдены' : 'В списке ЧС никого нет'}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => navigate('/emergency')}
                        leftIcon={<ShieldAlert className="h-4 w-4" />}
                      >
                        Перейти к управлению ЧС
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-gray-400">Показано {filteredEmergencyPassports.length} записей в ЧС</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/emergency')}
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
                        <Card variant="glass" hover className="p-4 border-red-500/20">
                          <div className="flex items-center justify-between">
                            {/* Содержимое карточки остается тем же... */}
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