// src/components/forms/UserForm.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Lock, Shield, ShieldCheck } from 'lucide-react';
import { User, UserCreate, UserUpdate } from '@/types';
import { Button, Input, Select, Modal } from '@/components/ui';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { validateForm } from '@/utils';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onSuccess?: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const isEditing = !!user;
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'police' as 'admin' | 'police',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { execute: createUser, isLoading: isCreating } = useApi(
    apiService.createUser,
    {
      showSuccessToast: true,
      successMessage: 'Пользователь создан успешно',
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    }
  );

  const { execute: updateUser, isLoading: isUpdating } = useApi(
    apiService.updateUser,
    {
      showSuccessToast: true,
      successMessage: 'Пользователь обновлен успешно',
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    }
  );

  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        role: 'police',
        is_active: true,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationRules = {
      username: {
        required: true,
        minLength: 3,
        maxLength: 50,
        label: 'Имя пользователя',
        pattern: /^[a-zA-Z0-9_]+$/,
        patternMessage: 'Имя пользователя может содержать только буквы, цифры и подчеркивания',
      },
      password: {
        required: !isEditing,
        minLength: 6,
        maxLength: 100,
        label: 'Пароль',
      },
      role: {
        required: true,
        label: 'Роль',
      },
    };

    const formErrors = validateForm(formData, validationRules);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      try {
        if (isEditing) {
          const updateData: UserUpdate = {
            username: formData.username,
            role: formData.role,
            is_active: formData.is_active,
          };

          if (formData.password) {
            updateData.password = formData.password;
          }

          await updateUser(user.id, updateData);
        } else {
          const createData: UserCreate = {
            username: formData.username,
            password: formData.password,
            role: formData.role,
            is_active: formData.is_active,
          };

          await createUser(createData);
        }
      } catch (error) {
        // Error handling is done in the useApi hook
      }
    }
  };

  const roleOptions = [
    { value: 'police', label: 'Полицейский' },
    { value: 'admin', label: 'Администратор' },
  ];

  const statusOptions = [
    { value: 'true', label: 'Активен' },
    { value: 'false', label: 'Заблокирован' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Редактировать пользователя' : 'Создать пользователя'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Имя пользователя"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          error={errors.username}
          leftIcon={<UserIcon className="h-4 w-4" />}
          placeholder="Введите имя пользователя"
          disabled={isLoading}
          fullWidth
        />

        <Input
          label={isEditing ? 'Новый пароль (оставьте пустым, чтобы не изменять)' : 'Пароль'}
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="h-4 w-4" />}
          placeholder={isEditing ? 'Введите новый пароль' : 'Введите пароль'}
          disabled={isLoading}
          fullWidth
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Роль"
            options={roleOptions}
            value={formData.role}
            onChange={(value) => handleChange('role', value)}
            error={errors.role}
            disabled={isLoading}
            fullWidth
          />

          <Select
            label="Статус"
            options={statusOptions}
            value={formData.is_active.toString()}
            onChange={(value) => handleChange('is_active', value === 'true')}
            disabled={isLoading}
            fullWidth
          />
        </div>

        {/* Role Description */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            formData.role === 'admin'
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-blue-500/10 border-blue-500/20'
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            {formData.role === 'admin' ? (
              <ShieldCheck className="h-5 w-5 text-red-400" />
            ) : (
              <Shield className="h-5 w-5 text-blue-400" />
            )}
            <h4 className={`font-medium ${
              formData.role === 'admin' ? 'text-red-400' : 'text-blue-400'
            }`}>
              {formData.role === 'admin' ? 'Администратор' : 'Полицейский'}
            </h4>
          </div>
          <p className="text-sm text-dark-300">
            {formData.role === 'admin'
              ? 'Полный доступ ко всем функциям системы, включая управление пользователями и просмотр логов'
              : 'Доступ к управлению паспортами и штрафами граждан'
            }
          </p>
        </motion.div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
          >
            {isEditing ? 'Обновить' : 'Создать'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;