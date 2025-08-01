// src/pages/Emergency.tsx - Обновленная цветовая схема
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ShieldAlert,
  Shield,
  MapPin,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Passport } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Layout } from '@/components/layout';
import { Button, Input, Table, StatCard, Card } from '@/components/ui';
import { EmergencyModal } from '@/components/modals';
import { formatDate, getInitials, formatRelativeTime } from '@/utils';
import MinecraftAvatar from '@/components/common/MinecraftAvatar';

const Emergency: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const {
    data: emergencyPassports,
    isLoading,
    execute: fetchEmergencyPassports,
  } = useApi(apiService.getEmergencyPassports);

  const {
    data: allPassports,
    execute: fetchAllPassports,
  } = useApi(apiService.getPassports);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchEmergencyPassports(),
      fetchAllPassports()
    ]);
  };

  const filteredEmergencyPassports = emergencyPassports?.filter(passport =>
    passport.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passport.city.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleManageEmergency = (passport: Passport) => {
    setSelectedPassport(passport);
    setIsEmergencyModalOpen(true);
  };

  const handleEmergencySuccess = () => {
    loadData();
  };

  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      render: (_: any, passport: Passport) => (
        <div className="ring-2 ring-red-500 shadow-red-500/30 animate-glow rounded-lg">
          <MinecraftAvatar
            nickname={passport.nickname}
            size={40}
            shape="square"
          />
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Имя',
      render: (_: any, passport: Passport) => (
        <div>
          <p className="font-medium text-white">
            {passport.first_name} {passport.last_name}
          </p>
          <p className="text-sm text-gray-400">{passport.nickname}</p>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Город',
      width: '120px',
      render: (city: string) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-primary-400" />
          <span className="text-primary-300">{city}</span>
        </div>
      ),
    },
    {
      key: 'violations_count',
      label: 'Нарушения',
      width: '100px',
      render: (count: number) => (
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="font-medium text-red-400">{count}</span>
        </div>
      ),
    },
    {
      key: 'entry_date',
      label: 'В городе с',
      width: '120px',
      render: (date: string) => (
        <span className="text-gray-400 text-sm">{formatDate(date, 'dd.MM.yyyy')}</span>
      ),
    },
    {
      key: 'updated_at',
      label: 'Последнее изменение',
      width: '150px',
      render: (date: string) => (
        <span className="text-gray-400 text-sm">{formatRelativeTime(date)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      width: '120px',
      render: (_: any, passport: Passport) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleManageEmergency(passport)}
            className="!p-2 text-green-400 hover:text-green-300"
            title="Убрать из ЧС"
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View passport', passport.id)}
            className="!p-2 text-primary-400 hover:text-primary-300"
            title="Подробнее"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Статистика с новыми цветами
  const totalEmergencyCount = emergencyPassports?.length || 0;
  const totalPassportCount = allPassports?.length || 0;
  const emergencyPercentage = totalPassportCount > 0
    ? Math.round((totalEmergencyCount / totalPassportCount) * 100)
    : 0;

  // Группировка по городам
  const emergencyByCity = emergencyPassports?.reduce((acc, passport) => {
    acc[passport.city] = (acc[passport.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topCitiesByEmergency = Object.entries(emergencyByCity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const stats = [
    {
      title: 'В списке ЧС',
      value: totalEmergencyCount,
      icon: ShieldAlert,
      color: 'danger' as const,
    },
    {
      title: 'От общего числа',
      value: `${emergencyPercentage}%`,
      icon: TrendingUp,
      color: 'accent' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'Всего паспортов',
      value: totalPassportCount,
      icon: Users,
      color: 'primary' as const, // ✨ НОВЫЙ цвет
    },
    {
      title: 'Активных городов',
      value: Object.keys(emergencyByCity).length,
      icon: MapPin,
      color: 'secondary' as const, // ✨ НОВЫЙ цвет
    },
  ];

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
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          leftIcon={<ShieldAlert className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          <span className="sm:hidden">Обновить</span>
          <span className="hidden sm:inline">Обновить</span>
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      title="Список ЧС"
      subtitle="Управление паспортами в чрезвычайных ситуациях"
      actions={actions}
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

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emergency Warning */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="minecraft" className="bg-red-500/10 border-red-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">
                  Внимание: Активные ЧС
                </h3>
              </div>
              <p className="text-red-300 mb-4">
                В системе зарегистрировано <strong>{totalEmergencyCount}</strong> человек
                в списке чрезвычайных ситуаций. Это составляет <strong>{emergencyPercentage}%</strong>
                от общего количества паспортов.
              </p>
              {totalEmergencyCount > 0 && (
                <div className="bg-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-200">
                    Регулярно проверяйте актуальность статуса ЧС и убирайте людей
                    из списка при необходимости.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Top Cities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="minecraft">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="h-6 w-6 text-primary-400" />
                <h3 className="text-lg font-semibold text-white">
                  ЧС по городам
                </h3>
              </div>
              {topCitiesByEmergency.length > 0 ? (
                <div className="space-y-3">
                  {topCitiesByEmergency.map(([city, count], index) => (
                    <div key={city} className="flex items-center justify-between">
                      <span className="text-gray-300">{city}</span>
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                          style={{
                            width: `${Math.max(20, (count / totalEmergencyCount) * 100)}px`
                          }}
                        />
                        <span className="text-primary-400 font-medium w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Нет данных по городам
                </p>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Table
            columns={columns}
            data={filteredEmergencyPassports}
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? `Паспорта в ЧС не найдены по запросу "${searchTerm}"`
                : 'В списке ЧС пока никого нет.'
            }
          />
        </motion.div>
      </div>

      {/* Emergency Management Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        passport={selectedPassport}
        onSuccess={handleEmergencySuccess}
      />
    </Layout>
  );
};

export default Emergency;