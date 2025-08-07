// src/components/modals/PaymentMethodModal.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Coins,
  DollarSign,
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { formatMoney } from '@/utils';
import { apiService } from '@/services/api';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  fineIds: number[];
  totalAmount: number;
  onPaymentInitiated?: () => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  fineIds,
  totalAmount,
  onPaymentInitiated,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bt' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [btBalance, setBtBalance] = useState<number | null>(null);
  const [btLoading, setBtLoading] = useState(false);

  // Получаем баланс баллов труда при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      fetchBTBalance();
      setSelectedMethod(null);
    }
  }, [isOpen]);

  const fetchBTBalance = async () => {
    setBtLoading(true);
    try {
      const passport = await apiService.getMyPassport();
      setBtBalance(passport.bt_balance || 0);
    } catch (error) {
      console.error('Failed to fetch BT balance:', error);
      setBtBalance(null);
    } finally {
      setBtLoading(false);
    }
  };

  const handleCardPayment = async () => {
    setIsLoading(true);
    try {
      const passport = await apiService.getMyPassport();
      
      // Создаём платеж через АР (старый механизм)
      const payment = await apiService.createPayment({
        passport_id: passport.id,
        fine_ids: fineIds
      });

      if (payment.payment_url) {
        window.open(payment.payment_url, '_blank');
      }

      onPaymentInitiated?.();
      onClose();
    } catch (error) {
      console.error('Card payment creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBTPayment = async () => {
    if (!btBalance || btBalance < totalAmount) return;

    setIsLoading(true);
    try {
      // Оплачиваем штрафы баллами труда
      const response = await apiService.payFinesWithBT(fineIds);
      
      if (response.success) {
        // Обновляем баланс
        setBtBalance(response.new_balance);
        onPaymentInitiated?.();
        onClose();
      }
    } catch (error) {
      console.error('BT payment failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'card') {
      handleCardPayment();
    } else if (selectedMethod === 'bt') {
      handleBTPayment();
    }
  };

  const canPayWithBT = btBalance !== null && btBalance >= totalAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Выберите способ оплаты"
      size="md"
    >
      <div className="space-y-6">
        {/* Информация о платеже */}
        <div className="bg-dark-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
            Сумма к оплате
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {formatMoney(totalAmount)}
            </span>
            <span className="text-sm text-gray-400">
              {fineIds.length} штрафов
            </span>
          </div>
        </div>

        {/* Способы оплаты */}
        <div className="space-y-4">
          {/* Оплата АР */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMethod('card')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'card'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 bg-dark-800/30 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedMethod === 'card' ? 'bg-primary-500/20' : 'bg-gray-700/50'
              }`}>
                <CreditCard className={`h-6 w-6 ${
                  selectedMethod === 'card' ? 'text-primary-400' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Банковская карта (АР)</h3>
                <p className="text-sm text-gray-400">
                  Оплата через систему АР с помощью банковской карты
                </p>
              </div>
              {selectedMethod === 'card' && (
                <Check className="h-5 w-5 text-primary-400" />
              )}
            </div>
          </motion.div>

          {/* Оплата баллами труда */}
          <motion.div
            whileHover={{ scale: canPayWithBT ? 1.02 : 1 }}
            whileTap={{ scale: canPayWithBT ? 0.98 : 1 }}
            onClick={() => canPayWithBT && setSelectedMethod('bt')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              !canPayWithBT 
                ? 'border-gray-700 bg-gray-800/20 opacity-50 cursor-not-allowed'
                : selectedMethod === 'bt'
                  ? 'border-orange-500 bg-orange-500/10 cursor-pointer'
                  : 'border-gray-600 bg-dark-800/30 hover:border-gray-500 cursor-pointer'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedMethod === 'bt' ? 'bg-orange-500/20' : 'bg-gray-700/50'
              }`}>
                <Coins className={`h-6 w-6 ${
                  selectedMethod === 'bt' ? 'text-orange-400' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-white">Баллы труда</h3>
                  {btLoading ? (
                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                  ) : (
                    <span className={`text-sm font-medium ${
                      canPayWithBT ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {btBalance !== null ? `${btBalance} БТ` : 'Недоступно'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {btBalance === null 
                    ? 'Не удалось загрузить баланс'
                    : canPayWithBT 
                      ? 'Оплата с помощью баллов труда'
                      : `Недостаточно баллов (нужно ${totalAmount} БТ)`
                  }
                </p>
                {!canPayWithBT && btBalance !== null && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-400">
                      Не хватает {totalAmount - btBalance} БТ
                    </span>
                  </div>
                )}
              </div>
              {selectedMethod === 'bt' && canPayWithBT && (
                <Check className="h-5 w-5 text-orange-400" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handlePayment}
            disabled={!selectedMethod || isLoading}
            loading={isLoading}
            leftIcon={selectedMethod === 'card' ? <CreditCard className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
          >
            {selectedMethod === 'card' 
              ? 'Перейти к оплате' 
              : selectedMethod === 'bt'
                ? 'Оплатить БТ'
                : 'Выберите способ'
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentMethodModal;