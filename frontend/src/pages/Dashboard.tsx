import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { Button, Card } from '@/components/ui';
import { LogOut, Users, FileText, AlertTriangle, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Добро пожаловать, {user?.username}!
            </h1>
            <p className="text-dark-400">
              Роль: {user?.role === 'admin' ? 'Администратор' : 'Полицейский'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Выйти
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Всего паспортов', value: '0', icon: Users, color: 'blue' },
            { title: 'Всего штрафов', value: '0', icon: FileText, color: 'green' },
            { title: 'Активных пользователей', value: '1', icon: Activity, color: 'yellow' },
            { title: 'Нарушений', value: '0', icon: AlertTriangle, color: 'red' },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-400 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-4">
                Система готова к работе
              </h2>
              <p className="text-dark-400 mb-8">
                Полный функционал будет доступен после настройки системы
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="primary">
                  Управление паспортами
                </Button>
                <Button variant="outline">
                  Управление штрафами
                </Button>
                {user?.role === 'admin' && (
                  <Button variant="secondary">
                    Настройки системы
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;