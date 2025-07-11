// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Key,
  Save,
  RefreshCw,
  Info,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Layout } from '@/components/layout';
import { Button, Input, Select, Card, Badge } from '@/components/ui';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { validateForm } from '@/utils';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system' | 'about'>('profile');
  const [profileData, setProfileData] = useState({
    username: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [systemData, setSystemData] = useState({
    project_name: 'РП Сервер',
    token_expire_minutes: '30',
    max_fines_per_user: '100',
    enable_notifications: true,
    enable_logging: true,
    theme: 'dark',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { execute: updateProfile, isLoading: isUpdatingProfile } = useApi(
    apiService.updateUser,
    {
      showSuccessToast: true,
      successMessage: 'Профиль обновлен успешно',
      onSuccess: () => {
        refreshUser();
        setProfileData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
      },
    }
  );

  const { execute: healthCheck, data: healthData } = useApi(apiService.healthCheck);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({ ...prev, username: user.username }));
    }
    healthCheck();
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationRules = {
      username: {
        required: true,
        minLength: 3,
        maxLength: 50,
        label: 'Имя пользователя',
      },
      current_password: {
        required: !!profileData.new_password,
        minLength: 6,
        label: 'Текущий пароль',
      },
      new_password: {
        minLength: 6,
        label: 'Новый пароль',
      },
      confirm_password: {
        required: !!profileData.new_password,
        minLength: 6,
        label: 'Подтверждение пароля',
      },
    };

    const formErrors = validateForm(profileData, validationRules);

    if (profileData.new_password && profileData.new_password !== profileData.confirm_password) {
      formErrors.confirm_password = 'Пароли не совпадают';
    }

    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0 && user) {
      const updateData: any = {
        username: profileData.username,
      };

      if (profileData.new_password) {
        updateData.password = profileData.new_password;
      }

      await updateProfile(user.id, updateData);
    }
  };

  const handleSystemSave = () => {
    // В реальном приложении здесь была бы отправка настроек на сервер
    console.log('Saving system settings:', systemData);
  };

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'system', label: 'Система', icon: SettingsIcon },
    { id: 'about', label: 'О программе', icon: Info },
  ];

  return (
    <Layout
      title="Настройки"
      subtitle="Управление настройками системы"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                        : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <User className="h-6 w-6 mr-3" />
                      Профиль пользователя
                    </h2>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Input
                            label="Имя пользователя"
                            value={profileData.username}
                            onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                            error={errors.username}
                            disabled={isUpdatingProfile}
                            fullWidth
                          />
                        </div>
                        <div>
                          <Badge variant={user?.role === 'admin' ? 'danger' : 'info'}>
                            {user?.role === 'admin' ? 'Администратор' : 'Полицейский'}
                          </Badge>
                        </div>
                      </div>

                      <div className="border-t border-dark-600 pt-6">
                        <h3 className="text-lg font-medium text-white mb-4">Смена пароля</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="Текущий пароль"
                            type="password"
                            value={profileData.current_password}
                            onChange={(e) => setProfileData(prev => ({ ...prev, current_password: e.target.value }))}
                            error={errors.current_password}
                            disabled={isUpdatingProfile}
                            fullWidth
                          />
                          <Input
                            label="Новый пароль"
                            type="password"
                            value={profileData.new_password}
                            onChange={(e) => setProfileData(prev => ({ ...prev, new_password: e.target.value }))}
                            error={errors.new_password}
                            disabled={isUpdatingProfile}
                            fullWidth
                          />
                          <Input
                            label="Подтвердите пароль"
                            type="password"
                            value={profileData.confirm_password}
                            onChange={(e) => setProfileData(prev => ({ ...prev, confirm_password: e.target.value }))}
                            error={errors.confirm_password}
                            disabled={isUpdatingProfile}
                            fullWidth
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          variant="primary"
                          loading={isUpdatingProfile}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Сохранить изменения
                        </Button>
                      </div>
                    </form>
                  </div>
                </Card>
              )}

              {activeTab === 'security' && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Shield className="h-6 w-6 mr-3" />
                      Безопасность
                    </h2>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-2">
                            Время жизни токена (минуты)
                          </label>
                          <Input
                            type="number"
                            value={systemData.token_expire_minutes}
                            onChange={(e) => setSystemData(prev => ({ ...prev, token_expire_minutes: e.target.value }))}
                            min="15"
                            max="1440"
                            fullWidth
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-2">
                            Максимум штрафов на пользователя
                          </label>
                          <Input
                            type="number"
                            value={systemData.max_fines_per_user}
                            onChange={(e) => setSystemData(prev => ({ ...prev, max_fines_per_user: e.target.value }))}
                            min="1"
                            max="1000"
                            fullWidth
                          />
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          <span className="font-medium text-yellow-400">Важно</span>
                        </div>
                        <p className="text-sm text-yellow-300">
                          Изменение настроек безопасности может повлиять на работу системы.
                          Убедитесь, что вы понимаете последствия изменений.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'system' && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <SettingsIcon className="h-6 w-6 mr-3" />
                      Системные настройки
                    </h2>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Название проекта"
                          value={systemData.project_name}
                          onChange={(e) => setSystemData(prev => ({ ...prev, project_name: e.target.value }))}
                          fullWidth
                        />
                        <Select
                          label="Тема интерфейса"
                          options={[
                            { value: 'dark', label: 'Темная' },
                            { value: 'light', label: 'Светлая' },
                            { value: 'auto', label: 'Автоматическая' },
                          ]}
                          value={systemData.theme}
                          onChange={(value) => setSystemData(prev => ({ ...prev, theme: value }))}
                          fullWidth
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={systemData.enable_notifications}
                            onChange={(e) => setSystemData(prev => ({ ...prev, enable_notifications: e.target.checked }))}
                            className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500/20"
                          />
                          <span className="text-dark-200">Включить уведомления</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={systemData.enable_logging}
                            onChange={(e) => setSystemData(prev => ({ ...prev, enable_logging: e.target.checked }))}
                            className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500/20"
                          />
                          <span className="text-dark-200">Включить логирование</span>
                        </label>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSystemSave}
                          variant="primary"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Сохранить настройки
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'about' && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Info className="h-6 w-6 mr-3" />
                      О программе
                    </h2>

                    <div className="space-y-6">
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Shield className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">PR Police</h3>
                        <p className="text-dark-400 mb-4">Система управления паспортами и штрафами</p>
                        <Badge variant="primary">Версия 1.0.0</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Информация о системе</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-dark-400">Статус системы:</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-400">Работает</span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">База данных:</span>
                              <span className="text-dark-200">
                                {healthData?.database || 'Подключена'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">Версия API:</span>
                              <span className="text-dark-200">
                                {healthData?.version || '1.0.0'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Технологии</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-dark-400">Frontend:</span>
                              <span className="text-dark-200">React + TypeScript</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">Backend:</span>
                              <span className="text-dark-200">FastAPI + Python</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">База данных:</span>
                              <span className="text-dark-200">PostgreSQL</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-dark-700/50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Лицензия</h4>
                        <p className="text-sm text-dark-300">
                          Эта программа распространяется под лицензией MIT.
                          Подробнее о лицензии и условиях использования можно
                          узнать в документации проекта.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;