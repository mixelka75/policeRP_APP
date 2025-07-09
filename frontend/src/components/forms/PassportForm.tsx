// src/components/forms/PassportForm.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, AtSign, Calendar, Users } from 'lucide-react';
import { Passport, PassportCreate, PassportUpdate } from '@/types';
import { Button, Input, Select, Modal } from '@/components/ui';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { validateForm } from '@/utils';

interface PassportFormProps {
  isOpen: boolean;
  onClose: () => void;
  passport?: Passport;
  onSuccess?: () => void;
}

const PassportForm: React.FC<PassportFormProps> = ({
  isOpen,
  onClose,
  passport,
  onSuccess,
}) => {
  const isEditing = !!passport;
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    age: '',
    gender: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { execute: createPassport, isLoading: isCreating } = useApi(
    apiService.createPassport,
    {
      showSuccessToast: true,
      successMessage: 'Паспорт создан успешно',
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    }
  );

  const { execute: updatePassport, isLoading: isUpdating } = useApi(
    apiService.updatePassport,
    {
      showSuccessToast: true,
      successMessage: 'Паспорт обновлен успешно',
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    }
  );

  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (passport) {
      setFormData({
        first_name: passport.first_name,
        last_name: passport.last_name,
        nickname: passport.nickname,
        age: passport.age.toString(),
        gender: passport.gender,
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        nickname: '',
        age: '',
        gender: '',
      });
    }
    setErrors({});
  }, [passport, isOpen]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationRules = {
      first_name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        label: 'Имя',
      },
      last_name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        label: 'Фамилия',
      },
      nickname: {
        required: true,
        minLength: 3,
        maxLength: 50,
        label: 'Никнейм',
        pattern: /^[a-zA-Z0-9_]+$/,
        patternMessage: 'Никнейм может содержать только буквы, цифры и подчеркивания',
      },
      age: {
        required: true,
        min: 16,
        max: 100,
        label: 'Возраст',
      },
      gender: {
        required: true,
        label: 'Пол',
      },
    };

    const formErrors = validateForm(formData, validationRules);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female',
      };

      try {
        if (isEditing) {
          await updatePassport(passport.id, submitData);
        } else {
          await createPassport(submitData);
        }
      } catch (error) {
        // Error handling is done in the useApi hook
      }
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Редактировать паспорт' : 'Создать паспорт'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Имя"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            error={errors.first_name}
            leftIcon={<User className="h-4 w-4" />}
            placeholder="Введите имя"
            disabled={isLoading}
            fullWidth
          />
          <Input
            label="Фамилия"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            error={errors.last_name}
            leftIcon={<User className="h-4 w-4" />}
            placeholder="Введите фамилию"
            disabled={isLoading}
            fullWidth
          />
        </div>

        <Input
          label="Никнейм"
          value={formData.nickname}
          onChange={(e) => handleChange('nickname', e.target.value)}
          error={errors.nickname}
          leftIcon={<AtSign className="h-4 w-4" />}
          placeholder="Введите никнейм"
          disabled={isLoading}
          fullWidth
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Возраст"
            type="number"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            error={errors.age}
            leftIcon={<Calendar className="h-4 w-4" />}
            placeholder="Введите возраст"
            min="16"
            max="100"
            disabled={isLoading}
            fullWidth
          />
          <Select
            label="Пол"
            options={genderOptions}
            value={formData.gender}
            onChange={(value) => handleChange('gender', value)}
            error={errors.gender}
            placeholder="Выберите пол"
            disabled={isLoading}
            fullWidth
          />
        </div>

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

export default PassportForm;