// src/pages/Dashboard.tsx - ИСПРАВЛЕННАЯ версия для мобильных устройств
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
import { UserPassportCard } from '@/components/common';
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

  const {
    data: myPassport,
    isLoading: myPassportLoading,
    execute: fetchMyPassport,
    error: myPassportError,
  } = useApi(apiService.getMyPassport, {
    showErrorToast: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.role === 'citizen') {
          return;
        }

        // Загружаем данные для админов и полицейских
        const promises = [
          fetchPassports(),
          fetchFines(),
          fetchEmergencyPassports(),
        ];

        // Также пытаемся загрузить свой паспорт (если есть)
        promises.push(fetchMyPassport());

        await Promise.all(promises);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'SESSION_EXPIRED') {
          return;
        }
      }
    };

    loadData();
  }, [user?.role]);

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

  const stats = [
    {
      title: 'Всего паспортов',
      value: passports?.length || 0,
      icon: Users,
      color: 'primary' as const,
    },
    {
      title: 'В списке ЧС',
      value: emergencyPassports?.length || 0,
      icon: ShieldAlert,
      color: 'danger' as const,
    },
    {
      title: 'Всего штрафов',
      value: fines?.length || 0,
      icon: FileText,
      color: 'secondary' as const,
    },
    {
      title: 'Сумма штрафов',
      value: formatMoney(fines?.reduce((sum, fine) => sum + fine.amount, 0) || 0),
      icon: AlertTriangle,
      color: 'accent' as const,
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

  const isInitialLoading = user?.role !== 'citizen' && passportsLoading && finesLoading && emergencyLoading;

  if (isInitialLoading) {
    return <Loading fullScreen text="Загрузка данных..." />;
  }

  // ✨ ИСПРАВЛЕННАЯ версия для граждан
  if (user?.role === 'citizen') {
    return (
      <Layout
        title="Главная"
        subtitle="Ваш паспорт"
      >
        <div className="space-y-4 sm:space-y-6">
          {/* ✨ User Info Banner для мобильных */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="minecraft" className="overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        user={user}
                        size={48}
                        showStatus={true}
                        className="sm:w-16 sm:h-16"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                        <h3 className="text-lg sm:text-2xl font-bold text-white truncate">
                          Добро пожаловать, {getDisplayName(user)}!!!!!
                        </h3>
                        <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-secondary-400 hidden sm:block" />
                      </div>
                      <p className="text-sm sm:text-base text-primary-300 font-medium">
                        {getRoleDisplayName(user.role)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* User Passport Card */}
          <UserPassportCard />
        </div>
      </Layout>
    );
  }

  const hasCriticalError = (passportsError || finesError || emergencyError) &&
    !(passportsError && typeof passportsError === 'string' && passportsError.includes('Сессия истекла')) &&
    !(finesError && typeof finesError === 'string' && finesError.includes('Сессия истекла')) &&
    !(emergencyError && typeof emergencyError === 'string' && emergencyError.includes('Сессия истекла'));

  if (hasCriticalError) {
    return (
      <div className="min-h-screen bg-minecraft-dark flex items-center justify-center p-4">
        <Card variant="minecraft" className="p-6 sm:p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Ошибка загрузки данных</h2>
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            Не удалось загрузить данные с сервера
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="minecraft"
            glow
            className="w-full sm:w-auto"
          >
            Обновить страницу
          </Button>
        </Card>
      </div>
    );
  }

  // ✨ ИСПРАВЛЕННЫЕ actions для мобильных
  const actions = (
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <Input
          placeholder="Поиск..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-64 minecraft-input"
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
      <Button
        variant={activeTab === 'emergency' ? 'danger' : 'minecraft'}
        size="sm"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={handleCreateClick}
        glow
        className="w-full sm:w-auto"
      >
        {activeTab === 'emergency'
          ? 'Управлять ЧС'
          : `${activeTab === 'fines' ? 'Штраф' : 'Паспорт'}`
        }
      </Button>
    </div>
  );

  return (
    <Layout
      title="Главная"
      subtitle="Обзор системы"
      actions={actions}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* ✨ ИСПРАВЛЕННЫЙ User Info Banner */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="minecraft" className="overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      user={user}
                      size={48}
                      showStatus={true}
                      className="sm:w-16 sm:h-16"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                      <h3 className="text-lg sm:text-2xl font-bold text-white truncate">
                        Добро пожаловать, {getDisplayName(user)}!!!!
                      </h3>
                      <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-secondary-400 hidden sm:block" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-1">
                      <p className="text-sm sm:text-base text-primary-300 font-medium">
                        {getRoleDisplayName(user.role)}
                      </p>
                      {user.minecraft_username && (
                        <>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <div className="flex items-center space-x-1 mt-1 sm:mt-0">
                            <Gamepad2 className="h-3 w-3 sm:h-4 sm:w-4 text-accent-400" />
                            <p className="text-xs sm:text-sm text-accent-400">
                              {user.minecraft_username}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      Последняя проверка: {formatDate(user.last_role_check)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center space-x-3 sm:space-x-0 sm:space-y-3">
                  {isUserDataOutdated(user) && (
                    <Badge variant="warning" size="sm" className="flex-shrink-0">
                      Данные устарели
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUserDataRefresh}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    className="flex-shrink-0"
                  >
                    <span className="sm:hidden">Обновить</span>
                    <span className="hidden sm:inline">Обновить данные</span>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* User Passport Card для админов и полицейских */}
        {user?.role !== 'citizen' && myPassport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <UserPassportCard />
          </motion.div>
        )}

        {/* ✨ ИСПРАВЛЕННАЯ статистика для мобильных */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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

        {/* ✨ ИСПРАВЛЕННОЕ Emergency Warning */}
        {emergencyPassports && emergencyPassports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="minecraft" className="border-red-500/30 bg-red-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start space-x-3 mb-3 sm:mb-0">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 animate-pulse flex-shrink-0 mt-1 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-red-400">
                      Активные чрезвычайные ситуации
                    </h3>
                    <p className="text-sm sm:text-base text-red-300">
                      В системе зарегистрировано <strong>{emergencyPassports.length}</strong> человек в списке ЧС
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => navigate('/emergency')}
                  glow
                  className="w-full sm:w-auto"
                >
                  Управлять
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ✨ ИСПРАВЛЕННЫЙ Main Content */}
        <Card variant="minecraft" className="min-h-[400px] sm:min-h-[600px]">
          {/* ✨ ИСПРАВЛЕННЫЕ Tabs для мобильных */}
          <div className="border-b border-primary-500/30 mb-4 sm:mb-6">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-400'
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

          {/* Content */}
          <div className="space-y-4">
            {/* Emergency Tab */}
            {activeTab === 'emergency' && (
              <div className="space-y-4">
                {emergencyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loading text="Загрузка списка ЧС..." />
                  </div>
                ) : filteredEmergencyPassports.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <ShieldAlert className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">
                      {searchTerm ? 'Паспорта в ЧС не найдены' : 'В списке ЧС никого нет'}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => navigate('/emergency')}
                        leftIcon={<ShieldAlert className="h-4 w-4" />}
                        className="w-full sm:w-auto"
                      >
                        Перейти к управлению ЧС
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                      <p className="text-gray-400 text-sm">Показано {filteredEmergencyPassports.length} записей в ЧС</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/emergency')}
                        className="w-full sm:w-auto"
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
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-white truncate text-sm sm:text-base">
                                  {passport.first_name} {passport.last_name}
                                </h4>
                                <p className="text-xs sm:text-sm text-red-300">
                                  {passport.nickname} • {passport.city}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="danger" size="sm">
                                {passport.violations_count} нарушений
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!p-2 text-primary-400 hover:text-primary-300"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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