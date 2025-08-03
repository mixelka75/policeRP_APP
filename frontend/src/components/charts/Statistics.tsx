// src/components/charts/Statistics.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Passport, Fine, User, Log } from '@/types';
import { Card } from '@/components/ui';
import { formatMoney } from '@/utils';
import { EXCLUDED_LOG_ACTIONS } from '@/constants/logs';

interface StatisticsProps {
  passports?: Passport[];
  fines?: Fine[];
  users?: User[];
  logs?: Log[];
}

const Statistics: React.FC<StatisticsProps> = ({
  passports = [],
  fines = [],
  users = [],
  logs = [],
}) => {
  // Статистика по возрастам
  const ageStatistics = useMemo(() => {
    const ageGroups = {
      '16-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0,
    };

    passports.forEach(passport => {
      if (passport.age <= 25) ageGroups['16-25']++;
      else if (passport.age <= 35) ageGroups['26-35']++;
      else if (passport.age <= 45) ageGroups['36-45']++;
      else if (passport.age <= 55) ageGroups['46-55']++;
      else ageGroups['56+']++;
    });

    return Object.entries(ageGroups).map(([age, count]) => ({
      age,
      count,
    }));
  }, [passports]);

  // Статистика по полу
  const genderStatistics = useMemo(() => {
    const genderCount = passports.reduce((acc, passport) => {
      acc[passport.gender] = (acc[passport.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Мужчины', value: genderCount.male || 0, color: '#c084fc' },
      { name: 'Женщины', value: genderCount.female || 0, color: '#e879f9' },
    ];
  }, [passports]);

  // Статистика по городам
  const cityStatistics = useMemo(() => {
    const cityCount = passports.reduce((acc, passport) => {
      acc[passport.city] = (acc[passport.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cityCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({
        city: city.length > 15 ? city.substring(0, 15) + '...' : city,
        count,
      }));
  }, [passports]);

  // Статистика по ЧС
  const emergencyStatistics = useMemo(() => {
    const emergencyCount = passports.filter(p => p.is_emergency).length;
    const normalCount = passports.length - emergencyCount;

    return [
      { name: 'Обычные', value: normalCount, color: '#10b981' },
      { name: 'В ЧС', value: emergencyCount, color: '#ef4444' },
    ];
  }, [passports]);

  // Статистика по нарушениям
  const violationsStatistics = useMemo(() => {
    const violationGroups = {
      '0': 0,
      '1-2': 0,
      '3-5': 0,
      '6-10': 0,
      '11+': 0,
    };

    passports.forEach(passport => {
      const count = passport.violations_count;
      if (count === 0) violationGroups['0']++;
      else if (count <= 2) violationGroups['1-2']++;
      else if (count <= 5) violationGroups['3-5']++;
      else if (count <= 10) violationGroups['6-10']++;
      else violationGroups['11+']++;
    });

    return Object.entries(violationGroups).map(([range, count]) => ({
      range,
      count,
    }));
  }, [passports]);

  // Статистика по штрафам по дням
  const dailyFinesStatistics = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(date => {
      const dayFines = fines.filter(fine =>
        fine.created_at.startsWith(date)
      );

      return {
        date: new Date(date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        }),
        count: dayFines.length,
        amount: dayFines.reduce((sum, fine) => sum + fine.amount, 0),
      };
    });

    return dailyData;
  }, [fines]);

  // Статистика по топ статьям штрафов
  const topFineArticles = useMemo(() => {
    const articleCount = fines.reduce((acc, fine) => {
      acc[fine.article] = (acc[fine.article] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(articleCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([article, count]) => ({
        article: article.length > 20 ? article.substring(0, 20) + '...' : article,
        count,
      }));
  }, [fines]);

  // Статистика активности пользователей
  const userActivityStatistics = useMemo(() => {
    const activityData = users.map(user => {
      const userLogs = logs.filter(log => 
        log.user_id === user.id && !EXCLUDED_LOG_ACTIONS.includes(log.action as any)
      );
      return {
        username: user.discord_username,
        actions: userLogs.length,
        role: user.role,
      };
    }).sort((a, b) => b.actions - a.actions);

    return activityData.slice(0, 5);
  }, [users, logs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
          <p className="text-dark-200 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'amount' ? formatMoney(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Age Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Распределение по возрасту
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageStatistics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="age" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#d4a574" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Emergency Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Статус ЧС
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={emergencyStatistics}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {emergencyStatistics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {emergencyStatistics.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-dark-300">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Cities Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Топ города по количеству жителей
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityStatistics} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="city" type="category" stroke="#9ca3af" width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#e879f9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Violations Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Распределение по нарушениям
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={violationsStatistics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#b67bb8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Gender Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Распределение по полу
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderStatistics}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {genderStatistics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {genderStatistics.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-dark-300">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Daily Fines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Штрафы за последние 7 дней
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyFinesStatistics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stackId="1"
                stroke="#9381b3"
                fill="#9381b3"
                fillOpacity={0.3}
                name="Количество"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Top Fine Articles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Топ статьи штрафов
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topFineArticles} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="article" type="category" stroke="#9ca3af" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#d946ef" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* User Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="lg:col-span-2"
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Активность пользователей
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userActivityStatistics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="username" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actions" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </div>
  );
};

export default Statistics;