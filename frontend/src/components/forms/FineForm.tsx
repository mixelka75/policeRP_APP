// src/components/forms/FineForm.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign } from 'lucide-react';
import { Fine, FineCreate, FineUpdate } from '@/types';
import { Button, Input, Modal, PassportSearchSelect } from '@/components/ui';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { validateForm, formatMoney } from '@/utils';

interface FineFormProps {
  isOpen: boolean;
  onClose: () => void;
  fine?: Fine;
  selectedPassportId?: number;
  onSuccess?: () => void;
}

const FineForm: React.FC<FineFormProps> = ({
  isOpen,
  onClose,
  fine,
  selectedPassportId,
  onSuccess,
}) => {
  const isEditing = !!fine;
  const [formData, setFormData] = useState({
    passport_id: '',
    article: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { execute: createFine, isLoading: isCreating } = useApi(
    apiService.createFine,
    {
      showSuccessToast: true,
      successMessage: 'Штраф создан успешно',
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    }
  );

  const { execute: updateFine, isLoading: isUpdating } = useApi(
    apiService.updateFine,
    {
      showSuccessToast: true,
      successMessage: 'Штраф обновлен успешно',
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    }
  );

  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (fine) {
      setFormData({
        passport_id: fine.passport_id.toString(),
        article: fine.article,
        amount: fine.amount.toString(),
        description: fine.description || '',
      });
    } else {
      setFormData({
        passport_id: selectedPassportId ? selectedPassportId.toString() : '',
        article: '',
        amount: '',
        description: '',
      });
    }
    setErrors({});
  }, [fine, selectedPassportId, isOpen]);


  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationRules = {
      passport_id: {
        required: true,
        label: 'Паспорт',
      },
      article: {
        required: true,
        minLength: 5,
        maxLength: 200,
        label: 'Статья нарушения',
      },
      amount: {
        required: true,
        min: 1,
        max: 1000000,
        label: 'Сумма штрафа',
      },
      description: {
        maxLength: 1000,
        label: 'Описание',
      },
    };

    const formErrors = validateForm(formData, validationRules);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      const submitData = {
        passport_id: parseInt(formData.passport_id),
        article: formData.article,
        amount: parseInt(formData.amount),
        description: formData.description || undefined,
      };

      try {
        if (isEditing) {
          await updateFine(fine.id, submitData);
        } else {
          await createFine(submitData);
        }
      } catch (error) {
        // Error handling is done in the useApi hook
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Редактировать штраф' : 'Выписать штраф'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <PassportSearchSelect
          label="Гражданин"
          value={formData.passport_id}
          onChange={(value) => handleChange('passport_id', value)}
          error={errors.passport_id}
          placeholder="Поиск по имени, фамилии или никнейму..."
          disabled={isLoading || isEditing}
          fullWidth
        />

        <Input
          label="Статья нарушения"
          value={formData.article}
          onChange={(e) => handleChange('article', e.target.value)}
          error={errors.article}
          leftIcon={<FileText className="h-4 w-4" />}
          placeholder="Введите статью нарушения"
          disabled={isLoading}
          fullWidth
        />

        <Input
          label="Сумма штрафа"
          type="number"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          error={errors.amount}
          leftIcon={<DollarSign className="h-4 w-4" />}
          placeholder="Введите сумму"
          min="1"
          max="1000000"
          disabled={isLoading}
          fullWidth
        />

        {formData.amount && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-4"
          >
            <p className="text-accent-400 text-sm">
              Сумма штрафа: {formatMoney(parseInt(formData.amount) || 0)}
            </p>
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-200">
            Описание (необязательно)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Дополнительное описание нарушения..."
            rows={4}
            disabled={isLoading}
            className="w-full bg-dark-800 border border-dark-600 text-dark-100 placeholder-dark-400 rounded-lg px-4 py-3 text-base transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          {errors.description && (
            <p className="text-sm text-red-400">{errors.description}</p>
          )}
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
            variant="danger"
            loading={isLoading}
          >
            {isEditing ? 'Обновить штраф' : 'Выписать штраф'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FineForm;