// src/components/forms/PassportForm.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, AtSign, Calendar, Users, MapPin } from 'lucide-react';
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
    city: '', // ✨ Теперь обычное поле
    entry_date: '', // ✨ НОВОЕ ПОЛЕ для ввода даты въезда
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
        city: passport.city,
        // ✨ Преобразуем дату в формат для input[type="date"]
        entry_date: passport.entry_date ? passport.entry_date.split('T')[0] : '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        nickname: '',
        age: '',
        gender: '',
        city: '',
        // ✨ По умолчанию - сегодняшняя дата
        entry_date: new Date().toISOString().split('T')[0],
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
      // ✨ ОБНОВЛЕННАЯ валидация для города
      city: {
        required: true,
        minLength: 2,
        maxLength: 100,
        label: 'Город',
      },
      // ✨ НОВАЯ валидация для даты въезда
      entry_date: {
        required: true,
        label: 'Дата въезда в город',
      },
    };

    const formErrors = validateForm(formData, validationRules);

    // ✨ Дополнительная валидация даты
    if (formData.entry_date) {
      const entryDate = new Date(formData.entry_date);
      const today = new Date();
      if (entryDate > today) {
        formErrors.entry_date = 'Дата въезда не может быть в будущем';
      }
    }

    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female',
        // ✨ Преобразуем дату обратно в ISO формат
        entry_date: formData.entry_date ? new Date(formData.entry_date).toISOString() : undefined,
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

        {/* ✨ ИЗМЕНЕННОЕ ПОЛЕ: Теперь Input вместо Select */}
        <Input
          label="Город проживания"
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
          error={errors.city}
          leftIcon={<MapPin className="h-4 w-4" />}
          placeholder="Введите название города"
          disabled={isLoading}
          fullWidth
        />

        {/* ✨ НОВОЕ ПОЛЕ: Дата въезда в город */}
        <Input
          label="Дата въезда в город"
          type="date"
          value={formData.entry_date}
          onChange={(e) => handleChange('entry_date', e.target.value)}
          error={errors.entry_date}
          leftIcon={<Calendar className="h-4 w-4" />}
          disabled={isLoading}
          fullWidth
        />

        {/* Информационный блок для редактирования */}
        {isEditing && passport && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-400" />
              <h4 className="font-medium text-blue-400">Информация о паспорте</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-400">Количество нарушений:</p>
                <p className="text-blue-300 font-medium">{passport.violations_count}</p>
              </div>
              <div>
                <p className="text-dark-400">Дата создания:</p>
                <p className="text-blue-300 font-medium">
                  {new Date(passport.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
            {passport.is_emergency && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-medium">Находится в списке ЧС</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ✨ НОВЫЙ информационный блок для создания */}
        {!isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-green-400" />
              <h4 className="font-medium text-green-400">Информация</h4>
            </div>
            <p className="text-green-300 text-sm">
              Дата въезда в город используется для отслеживания времени пребывания гражданина
              в городе. По умолчанию устанавливается сегодняшняя дата.
            </p>
          </motion.div>
        )}

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