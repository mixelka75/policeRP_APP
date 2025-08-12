// src/components/modals/LogDetailsModal.tsx
import React from 'react';
import { 
  User,
  FileText,
  Info,
  Shield,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Modal } from '@/components/ui';
import { Log, User as UserType } from '@/types';
import { formatDate } from '@/utils';
import { UserAvatar } from '@/components/common';

interface LogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: Log | null;
  user: UserType | null;
}

const LogDetailsModal: React.FC<LogDetailsModalProps> = ({
  isOpen,
  onClose,
  log,
  user
}) => {
  console.log('=== LogDetailsModal Render ===');
  console.log('isOpen:', isOpen);
  console.log('log:', log);
  console.log('user:', user);
  
  if (!isOpen) {
    console.log('LogDetailsModal: Not open, returning null');
    return null;
  }
  
  if (!log) {
    console.log('LogDetailsModal: No log provided, returning null');
    return null;
  }
  
  // Additional safety check for React rendering
  try {
  
  // Defensive check for required log properties (more lenient)
  if (!log.action) {
    console.error('Invalid log data provided to LogDetailsModal - missing action:', log);
    return null;
  }
  
  // Set default entity_type if missing
  const entityType = log.entity_type || 'unknown';

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Создание';
      case 'UPDATE': return 'Обновление';
      case 'DELETE': return 'Удаление';
      case 'LOGIN': return 'Вход в систему';
      case 'VIEW': return 'Просмотр';
      case 'EMERGENCY_STATUS_CHANGE': return 'Изменение статуса ЧС';
      case 'FINE_PAYMENT': return 'Оплата штрафа';
      default: return action;
    }
  };

  const getEntityDescription = (entityType: string) => {
    switch (entityType) {
      case 'passport': return 'Паспорт';
      case 'fine': return 'Штраф';
      case 'user': return 'Пользователь';
      case 'payment': return 'Платеж';
      default: return entityType;
    }
  };

  const renderEntityDetails = () => {
    if (!log.details || typeof log.details !== 'object') return null;
    
    try {

    switch (entityType) {
      case 'passport':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center">
              <User className="h-4 w-4 mr-2 text-primary-400" />
              Информация о паспорте
            </h4>
            <div className="bg-dark-700/50 rounded-lg p-4 space-y-2">
              {/* Display basic passport info */}
              {log.details.first_name && log.details.last_name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">ФИО:</span>
                  <span className="text-white">{log.details.first_name} {log.details.last_name}</span>
                </div>
              )}
              {log.details.nickname && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Ник:</span>
                  <span className="text-primary-400">{log.details.nickname}</span>
                </div>
              )}
              {log.details.age && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Возраст:</span>
                  <span className="text-white">{log.details.age} лет</span>
                </div>
              )}
              {log.details.city && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Город:</span>
                  <span className="text-white flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {log.details.city}
                  </span>
                </div>
              )}
              {log.details.is_emergency !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Статус ЧС:</span>
                  <span className={`flex items-center ${log.details.is_emergency ? 'text-red-400' : 'text-green-400'}`}>
                    {log.details.is_emergency ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                    {log.details.is_emergency ? 'В ЧС' : 'Не в ЧС'}
                  </span>
                </div>
              )}
              
              {/* Display changes for UPDATE actions */}
              {log.action === 'UPDATE' && log.details.changes && typeof log.details.changes === 'object' && (
                <div className="border-t border-dark-600 pt-3 mt-3">
                  <h5 className="text-sm font-medium text-white mb-2">Изменения</h5>
                  <div className="space-y-2">
                    {Object.entries(log.details.changes).map(([key, change]) => {
                      if (typeof change === 'object' && change !== null && 'old' in change && 'new' in change) {
                        const fieldName = {
                          'first_name': 'Имя',
                          'last_name': 'Фамилия',
                          'nickname': 'Ник',
                          'age': 'Возраст',
                          'city': 'Город',
                          'gender': 'Пол',
                          'discord_id': 'Discord ID'
                        }[key] || key;
                        
                        return (
                          <div key={key} className="bg-dark-800/50 rounded p-2">
                            <div className="text-xs text-gray-400 mb-1">{fieldName}</div>
                            <div className="flex items-center space-x-2">
                              <span className="text-red-400 text-sm line-through">{String(change.old)}</span>
                              <span className="text-gray-500">→</span>
                              <span className="text-green-400 text-sm">{String(change.new)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'fine':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center">
              <Shield className="h-4 w-4 mr-2 text-red-400" />
              Информация о штрафе
            </h4>
            <div className="bg-dark-700/50 rounded-lg p-4 space-y-2">
              {log.details.article && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Статья:</span>
                  <span className="text-white">{log.details.article}</span>
                </div>
              )}
              {log.details.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Сумма:</span>
                  <span className="text-red-400 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {log.details.amount} АР
                  </span>
                </div>
              )}
              {log.details.description && (
                <div>
                  <span className="text-gray-400">Описание:</span>
                  <p className="text-white mt-1">{log.details.description}</p>
                </div>
              )}
              {log.details.passport_info && (
                <div className="border-t border-dark-600 pt-3 mt-3">
                  <h5 className="text-sm font-medium text-white mb-2">Информация о нарушителе</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ФИО:</span>
                      <span className="text-primary-400">{log.details.passport_info.first_name} {log.details.passport_info.last_name}</span>
                    </div>
                    {log.details.passport_info.nickname && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Minecraft ник:</span>
                        <span className="text-primary-400">{log.details.passport_info.nickname}</span>
                      </div>
                    )}
                    {log.details.passport_info.age && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Возраст:</span>
                        <span className="text-white">{log.details.passport_info.age} лет</span>
                      </div>
                    )}
                    {log.details.passport_info.city && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Город:</span>
                        <span className="text-white">{log.details.passport_info.city}</span>
                      </div>
                    )}
                    {log.details.passport_info.discord_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Discord ID:</span>
                        <span className="text-white font-mono text-sm">{log.details.passport_info.discord_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {log.details.is_paid !== undefined && (
                <div className="border-t border-dark-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Статус оплаты:</span>
                    <span className={`flex items-center ${log.details.is_paid ? 'text-green-400' : 'text-red-400'}`}>
                      {log.details.is_paid ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {log.details.is_paid ? 'Оплачен' : 'Не оплачен'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-400" />
              Информация о платеже
            </h4>
            <div className="bg-dark-700/50 rounded-lg p-4 space-y-2">
              {log.details.total_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Сумма:</span>
                  <span className="text-green-400">{log.details.total_amount} АР</span>
                </div>
              )}
              {log.details.fine_ids && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Штрафов оплачено:</span>
                  <span className="text-white">{log.details.fine_ids.length}</span>
                </div>
              )}
              {log.details.payer_nickname && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Плательщик:</span>
                  <span className="text-primary-400">{log.details.payer_nickname}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center">
              <Info className="h-4 w-4 mr-2 text-gray-400" />
              Дополнительная информация
            </h4>
            <div className="bg-dark-700/50 rounded-lg p-4">
              {log.details && Object.keys(log.details).length > 0 ? (
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-400 text-sm">Нет дополнительной информации</p>
              )}
            </div>
          </div>
        );
    }
    } catch (error) {
      console.error('Error rendering entity details:', error);
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">Ошибка отображения данных</p>
        </div>
      );
    }
  };

  console.log('LogDetailsModal: About to render Modal component');
  console.log('Modal props:', { isOpen, title: "Подробности лога", size: "lg" });
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Подробности лога"
      size="lg"
    >
      <div className="space-y-6">
        {/* Основная информация */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-400" />
            Основная информация
          </h3>
          
          <div className="bg-dark-700/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Действие:</span>
              <span className="text-white font-medium">{getActionDescription(log.action)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Объект:</span>
              <span className="text-white">{getEntityDescription(entityType)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Время:</span>
              <div className="text-right">
                <p className="text-white">{log.created_at ? formatDate(log.created_at, 'dd.MM.yyyy HH:mm:ss') : 'Неизвестно'}</p>
                <p className="text-xs text-gray-400">ID лога: {log.id || 'Неизвестно'}</p>
              </div>
            </div>

            {log.ip_address && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">IP адрес:</span>
                <span className="text-white font-mono">{log.ip_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Информация о пользователе */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <User className="h-5 w-5 mr-2 text-secondary-400" />
            Пользователь
          </h3>
          
          <div className="bg-dark-700/30 rounded-lg p-4">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar user={user} size={40} showStatus />
                  <div>
                    <p className="text-white font-medium">{user.discord_username}</p>
                    <p className="text-sm text-gray-400">
                      {user.role === 'admin' ? 'Администратор' : user.role === 'police' ? 'Полицейский' : 'Гость'}
                    </p>
                    {user.minecraft_username && (
                      <p className="text-xs text-primary-400">Minecraft: {user.minecraft_username}</p>
                    )}
                  </div>
                </div>
                
                {/* Дополнительная информация о пользователе */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-dark-600/50">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Discord ID:</span>
                    <span className="text-white font-mono text-sm">{user.discord_id || 'Неизвестно'}</span>
                  </div>
                  {user.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Последнее обновление:</span>
                      <span className="text-white text-sm">{formatDate(user.updated_at, 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Регистрация:</span>
                    <span className="text-white text-sm">{user.created_at ? formatDate(user.created_at, 'dd.MM.yyyy') : 'Неизвестно'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Пользователь не найден (ID: {log.user_id})</p>
            )}
          </div>
        </div>

        {/* Детали объекта */}
        {renderEntityDetails()}
      </div>
    </Modal>
  );
  
  } catch (error) {
    console.error('Error rendering LogDetailsModal:', error);
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Ошибка"
        size="md"
      >
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            Произошла ошибка при отображении деталей лога. Попробуйте обновить страницу.
          </p>
        </div>
      </Modal>
    );
  }
};

export default LogDetailsModal;