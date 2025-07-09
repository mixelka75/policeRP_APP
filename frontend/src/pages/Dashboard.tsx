// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  AlertTriangle,
  Activity,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Passport, Fine } from '@/types';
import { Button, Card, StatCard, Loading, Input } from '@/components/ui';
import { formatDate, formatMoney } from '@/utils';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'fines' | 'passports'>('fines');
  const [searchTerm, setSearchTerm] = useState('');

  // API hooks
  const {
    data: passports,
    isLoading: passportsLoading,
    execute: fetchPassports,
  } = useApi(apiService.getPassports);

  const {
    data: fines,
    isLoading: finesLoading,
    execute: fetchFines,
  } = useApi(apiService.getFines);

  useEffect(() => {
    fetchPassports();
    fetchFines();
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
    {
      title: 'Активность',
      value: '24/7',
      icon: Activity,
      color: 'purple' as const,
    },
  ];

  const tabs = [
    { id: 'fines', label: 'Штрафы', icon: AlertTriangle },
    { id: 'passports', label: 'Паспорта', icon: Users },
  ];

  if (passportsLoading || finesLoading) {
    return <Loading fullScreen text="Загрузка данных..." />;
  }

  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Добро пожаловать, {user?.username}!
              </h1>
              <p className="text-dark-400">
                Управление системой РП сервера
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Создать
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
              >
                Экспорт
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              >
                Фильтры
              </Button>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Добавить {activeTab === 'fines' ? 'штраф' : 'паспорт'}
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {activeTab === 'fines' && (
              <div className="space-y-4">
                {filteredFines.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                    <p className="text-dark-400">
                      {searchTerm ? 'Штрафы не найдены' : 'Штрафов пока нет'}
                    </p>
                  </div>
                ) : (
                  filteredFines.map((fine, index) => (
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
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!p-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!p-2 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'passports' && (
              <div className="space-y-4">
                {filteredPassports.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                    <p className="text-dark-400">
                      {searchTerm ? 'Паспорта не найдены' : 'Паспортов пока нет'}
                    </p>
                  </div>
                ) : (
                  filteredPassports.map((passport, index) => (
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
                                  @{passport.nickname}
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
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!p-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!p-2 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;