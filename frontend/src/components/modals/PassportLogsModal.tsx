// src/components/modals/PassportLogsModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText,
  Activity,
  Eye,
  User,
  Trash2,
  Plus,
  Edit,
  LogIn,
  Shield,
  ShieldAlert,
  List,
  ShieldCheck,
  Key,
  Loader2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { Log, User as UserType, Passport } from '@/types';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { formatRelativeTime } from '@/utils';
import LogDetailsModal from './LogDetailsModal';
import PassportLogFilters, { PassportLogFilterOptions } from './PassportLogFilters';
import { UserAvatar } from '@/components/common';
import { EXCLUDED_LOG_ACTIONS } from '@/constants/logs';

interface PassportLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: Passport | null;
}

const PassportLogsModal: React.FC<PassportLogsModalProps> = ({
  isOpen,
  onClose,
  passport
}) => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<Log[]>([]);
  const [usersMap, setUsersMap] = useState<Map<number, UserType>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<PassportLogFilterOptions>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const { execute: fetchUsers } = useApi(apiService.getUsers);

  useEffect(() => {
    if (isOpen && passport) {
      loadUsers();
      loadPassportLogs();
    }
  }, [isOpen, passport]);

  const loadUsers = async () => {
    try {
      const users = await fetchUsers();
      const map = new Map();
      users.forEach((user: UserType) => {
        map.set(user.id, user);
      });
      setUsersMap(map);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadPassportLogs = async () => {
    if (!passport) return;
    
    // Проверяем, что пользователь админ
    if (!user || user.role !== 'admin') {
      setLoadError('Только администраторы могут просматривать логи');
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log('Loading passport logs for:', passport);
      // Filter logs related to this passport - get multiple pages to ensure we get recent logs
      console.log('Fetching logs from multiple pages...');
      const page1 = await apiService.getLogs(0, 100); // Page 0 - newest
      const page2 = await apiService.getLogs(1, 100); // Page 1 - older
      
      const allLogs = [...page1.logs, ...page2.logs];
      const result = { logs: allLogs, pagination: page1.pagination };
      console.log('Filtering through all logs:', result.logs);
      console.log('Looking for passport:', passport);
      
      const passportLogs = result.logs.filter(log => {
        console.log('Processing log:', {
          id: log.id,
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          details: log.details
        });
        
        // Exclude specific actions
        if (EXCLUDED_LOG_ACTIONS.includes(log.action as any)) {
          console.log('Excluding log due to action filter:', log.action);
          return false;
        }
        
        // Check if the log is related to this passport
        if (log.entity_type === 'passport' && log.entity_id === passport.id) {
          console.log('Found matching log by entity_id:', log);
          return true;
        }
        
        // Additional check for passport logs by details content
        if (log.entity_type === 'passport' && log.details) {
          // Check if details contain this passport's data
          const details = log.details;
          console.log('Checking log details for passport match:', {
            logId: log.id,
            logAction: log.action,
            details: details,
            passport: {
              id: passport.id,
              nickname: passport.nickname,
              first_name: passport.first_name,
              last_name: passport.last_name,
              discord_id: passport.discord_id
            }
          });
          
          // Check by nickname in details
          if (details.nickname === passport.nickname) {
            console.log('Found matching log by nickname:', log);
            return true;
          }
          
          // Check by full name in details
          if (details.first_name === passport.first_name && 
              details.last_name === passport.last_name) {
            console.log('Found matching log by full name:', log);
            return true;
          }
          
          // Check by discord_id in details
          if (details.discord_id === passport.discord_id) {
            console.log('Found matching log by discord_id:', log);
            return true;
          }
          
          // Check changes object for passport updates
          if (details.changes && typeof details.changes === 'object') {
            // Check if any change involves this passport's data
            const changes = details.changes;
            for (const [key, change] of Object.entries(changes)) {
              if (typeof change === 'object' && change !== null && 'old' in change && 'new' in change) {
                // Check if the old or new value matches this passport
                if ((key === 'nickname' && (change.old === passport.nickname || change.new === passport.nickname)) ||
                    (key === 'first_name' && (change.old === passport.first_name || change.new === passport.first_name)) ||
                    (key === 'last_name' && (change.old === passport.last_name || change.new === passport.last_name)) ||
                    (key === 'discord_id' && (change.old === passport.discord_id || change.new === passport.discord_id))) {
                  return true;
                }
              }
            }
          }
          
          // Check if the log contains matching full_name field (from logger output)
          if (details.full_name && details.full_name === `${passport.first_name} ${passport.last_name}`) {
            return true;
          }
        }
        
        // Check if it's a fine related to this passport
        if (log.entity_type === 'fine' && log.details?.passport_info) {
          const passportInfo = log.details.passport_info;
          console.log('Checking fine log for passport match:', {
            logId: log.id,
            logAction: log.action,
            passportInfo: passportInfo,
            currentPassport: {
              first_name: passport.first_name,
              last_name: passport.last_name,
              discord_id: passport.discord_id,
              nickname: passport.nickname
            }
          });
          
          // Match by passport info
          if (passportInfo.first_name === passport.first_name &&
              passportInfo.last_name === passport.last_name &&
              passportInfo.discord_id === passport.discord_id) {
            console.log('Found matching fine log by passport info:', log);
            return true;
          }
          
          // Also check by nickname if available
          if (passportInfo.nickname && passportInfo.nickname === passport.nickname) {
            console.log('Found matching fine log by nickname:', log);
            return true;
          }
        }
        
        // Check if it's a fine related to this passport by passport_id
        if (log.entity_type === 'fine' && log.details?.passport_id === passport.id) {
          console.log('Found matching fine log by passport_id:', log);
          return true;
        }
        
        // Check if it's a payment related to this passport
        if (log.entity_type === 'payment') {
          console.log('Checking payment log for passport match:', {
            logId: log.id,
            logAction: log.action,
            details: log.details,
            passportNickname: passport.nickname,
            passportId: passport.id
          });
          
          // Check by payer nickname
          if (log.details?.payer_nickname === passport.nickname) {
            console.log('Found matching payment log by payer nickname:', log);
            return true;
          }
          
          // Check by passport_id if available
          if (log.details?.passport_id === passport.id) {
            console.log('Found matching payment log by passport_id:', log);
            return true;
          }
          
          // Check if payment contains passport info
          if (log.details?.passport_info) {
            const passportInfo = log.details.passport_info;
            if (passportInfo.first_name === passport.first_name &&
                passportInfo.last_name === passport.last_name &&
                passportInfo.discord_id === passport.discord_id) {
              console.log('Found matching payment log by passport info:', log);
              return true;
            }
          }
        }
        
        return false;
      });
      
      // Sort logs by creation date (newest first)
      passportLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`Found ${passportLogs.length} logs for passport ${passport.first_name} ${passport.last_name} (ID: ${passport.id}):`, passportLogs);
      setLogs(passportLogs);
    } catch (error) {
      console.error('Failed to load passport logs:', error);
      setLoadError('Ошибка загрузки логов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetails = (log: Log) => {
    console.group('=== PASSPORT LOG DETAILS BUTTON CLICKED ===');
    console.log('Log object:', log);
    console.log('Log ID:', log.id);
    console.log('Log action:', log.action);
    console.log('Log entity_type:', log.entity_type);
    console.log('Log entity_id:', log.entity_id);
    console.log('Log details:', log.details);
    console.log('Log created_at:', log.created_at);
    console.log('Log user_id:', log.user_id);
    console.log('User from map:', usersMap.get(log.user_id));
    console.log('Passport:', passport);
    console.log('Current selected log:', selectedLog);
    console.log('Current modal state:', isDetailsModalOpen);
    
    try {
      if (!log) {
        console.error('No log data provided to PassportLogsModal handleShowDetails');
        console.groupEnd();
        return;
      }
      
      if (!log.action) {
        console.error('Log missing action in PassportLogsModal, cannot show details:', log);
        console.groupEnd();
        return;
      }
      
      if (!log.id) {
        console.warn('Log missing ID in PassportLogsModal, but attempting to show details anyway:', log);
      }
      
      console.log('Setting selected log...');
      setSelectedLog(log);
      console.log('Opening details modal...');
      setIsDetailsModalOpen(true);
      console.log('Modal operations completed');
      
    } catch (error) {
      console.error('Error in PassportLogsModal handleShowDetails:', error);
    }
    
    console.groupEnd();
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    // Delay clearing the selected log to allow modal to close smoothly
    setTimeout(() => {
      setSelectedLog(null);
    }, 150);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return Plus;
      case 'UPDATE':
        return Edit;
      case 'DELETE':
        return Trash2;
      case 'LOGIN':
        return LogIn;
      case 'VIEW':
        return Eye;
      case 'EMERGENCY_STATUS_CHANGE':
        return ShieldAlert;
      case 'VIEW_LIST':
        return List;
      case 'VIEW_EMERGENCY_LIST':
        return ShieldCheck;
      case 'TOKEN_CHECK':
        return Key;
      case 'FINE_PAYMENT':
        return Shield;
      default:
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-400';
      case 'UPDATE':
        return 'text-primary-400';
      case 'DELETE':
        return 'text-red-400';
      case 'LOGIN':
        return 'text-accent-400';
      case 'VIEW':
        return 'text-gray-400';
      case 'EMERGENCY_STATUS_CHANGE':
        return 'text-red-500';
      case 'VIEW_LIST':
        return 'text-secondary-400';
      case 'VIEW_EMERGENCY_LIST':
        return 'text-orange-400';
      case 'TOKEN_CHECK':
        return 'text-blue-400';
      case 'FINE_PAYMENT':
        return 'text-green-500';
      default:
        return 'text-gray-300';
    }
  };

  const getActionName = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Создание';
      case 'UPDATE':
        return 'Обновление';
      case 'DELETE':
        return 'Удаление';
      case 'LOGIN':
        return 'Вход';
      case 'VIEW':
        return 'Просмотр';
      case 'EMERGENCY_STATUS_CHANGE':
        return 'Изменение ЧС';
      case 'VIEW_LIST':
        return 'Просмотр списка';
      case 'VIEW_EMERGENCY_LIST':
        return 'Просмотр ЧС списка';
      case 'TOKEN_CHECK':
        return 'Проверка токена';
      case 'FINE_PAYMENT':
        return 'Оплата штрафа';
      case 'SEARCH_BY_NICKNAME':
        return 'Поиск по нику';
      case 'SEARCH_BY_DISCORD_ID':
        return 'Поиск по Discord ID';
      case 'VIEW_OWN_PASSPORT':
        return 'Просмотр своего паспорта';
      default:
        return action;
    }
  };

  const getEntityName = (entityType: string) => {
    switch (entityType) {
      case 'passport':
        return 'Паспорт';
      case 'fine':
        return 'Штраф';
      case 'user':
        return 'Пользователь';
      case 'emergency':
        return 'ЧС статус';
      case 'payment':
        return 'Платеж';
      default:
        return entityType;
    }
  };

  // Filter logic
  const filteredLogs = useMemo(() => {
    if (!logs.length) return [];

    return logs.filter(log => {
      // Search filter - search in action, entity type, and details
      if (appliedFilters.search) {
        const searchTerm = appliedFilters.search.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(searchTerm);
        const matchesEntityType = log.entity_type.toLowerCase().includes(searchTerm);
        const matchesDetails = log.details ? 
          JSON.stringify(log.details).toLowerCase().includes(searchTerm) : false;
        
        if (!matchesAction && !matchesEntityType && !matchesDetails) {
          return false;
        }
      }

      // Action type filter
      if (appliedFilters.actionType && log.action !== appliedFilters.actionType) {
        return false;
      }

      // Entity type filter
      if (appliedFilters.entityType && log.entity_type !== appliedFilters.entityType) {
        return false;
      }

      // Date range filter
      if (appliedFilters.dateRange?.start) {
        const logDate = new Date(log.created_at);
        const startDate = new Date(appliedFilters.dateRange.start);
        if (logDate < startDate) return false;
      }

      if (appliedFilters.dateRange?.end) {
        const logDate = new Date(log.created_at);
        const endDate = new Date(appliedFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (logDate > endDate) return false;
      }

      // User filter
      if (appliedFilters.userId && log.user_id !== appliedFilters.userId) {
        return false;
      }

      return true;
    });
  }, [logs, appliedFilters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.actionType) count++;
    if (appliedFilters.entityType) count++;
    if (appliedFilters.dateRange?.start) count++;
    if (appliedFilters.dateRange?.end) count++;
    if (appliedFilters.userId) count++;
    return count;
  }, [appliedFilters]);

  const handleApplyFilters = (filters: PassportLogFilterOptions) => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setAppliedFilters({});
  };

  if (!passport) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Логи паспорта: ${passport.first_name} ${passport.last_name}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Passport Info Header */}
          <div className="bg-dark-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-primary-400" />
              <div>
                <h3 className="text-lg font-medium text-white">
                  {passport.first_name} {passport.last_name}
                </h3>
                <p className="text-sm text-gray-400">
                  {passport.nickname ? `Ник: ${passport.nickname}` : `Discord: ${passport.discord_id}`}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <PassportLogFilters
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen(!isFilterOpen)}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            currentFilters={appliedFilters}
            users={usersMap}
            activeFilterCount={activeFilterCount}
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-primary-400" />
                <span className="text-sm text-gray-400">Всего записей</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">{logs.length}</p>
              {filteredLogs.length !== logs.length && (
                <p className="text-xs text-gray-500 mt-1">
                  Отфильтровано: {filteredLogs.length}
                </p>
              )}
            </div>
            <div className="bg-dark-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400" />
                <span className="text-sm text-gray-400">За сегодня</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">
                {filteredLogs.filter(log => {
                  const today = new Date();
                  const logDate = new Date(log.created_at);
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <div className="bg-dark-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="text-sm text-gray-400">Штрафов</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">
                {filteredLogs.filter(log => log.entity_type === 'fine').length}
              </p>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <ScrollText className="h-5 w-5 mr-2 text-primary-400" />
              История действий
            </h3>
            
            {loadError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400">{loadError}</p>
                {user?.role !== 'admin' && (
                  <p className="text-gray-500 text-sm mt-2">
                    Обратитесь к администратору для получения доступа к логам
                  </p>
                )}
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Загрузка логов...</span>
                </div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <ScrollText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {activeFilterCount > 0 
                    ? 'Логи не найдены по заданным фильтрам' 
                    : 'Логи для этого паспорта не найдены'
                  }
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="mt-4"
                  >
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.map((log, index) => {
                  const user = usersMap.get(log.user_id);
                  const Icon = getActionIcon(log.action);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700/70 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className={`h-4 w-4 ${getActionColor(log.action)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                              {getActionName(log.action)}
                            </span>
                            <span className="text-gray-400 text-sm">
                              {getEntityName(log.entity_type)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            {user && (
                              <div className="flex items-center space-x-2">
                                <UserAvatar user={user} size={20} />
                                <span className="text-xs text-gray-400">
                                  {user.discord_username}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(log.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {(() => {
                        // Не показываем кнопку для просмотра списков и других нежелательных действий
                        const hideButtonActions = ['VIEW_LIST', 'VIEW_EMERGENCY_LIST', 'VIEW_STATISTICS'];
                        
                        if (hideButtonActions.includes(log.action)) {
                          return <span className="text-gray-500 text-xs w-8 h-8 flex items-center justify-center">—</span>;
                        }
                        
                        return (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              try {
                                e.preventDefault();
                                e.stopPropagation();
                                handleShowDetails(log);
                              } catch (error) {
                                console.error('Error in PassportLogsModal button onClick:', error);
                              }
                            }}
                            className="!p-2 text-gray-400 hover:text-gray-300 hover:bg-primary-500/10"
                            type="button"
                            title="Показать подробности"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        );
                      })()}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Log Details Modal */}
      <LogDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        log={selectedLog}
        user={selectedLog ? usersMap.get(selectedLog.user_id) || null : null}
      />
    </>
  );
};

export default PassportLogsModal;