// src/components/ui/Select.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите опцию',
  label,
  error,
  disabled = false,
  fullWidth = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', { 'w-full': fullWidth }, className)}>
      {label && (
        <label className="block text-sm font-medium text-dark-200 mb-2">
          {label}
        </label>
      )}

      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full bg-dark-800 border border-dark-600 text-dark-100 rounded-lg px-4 py-3 text-base',
            'transition-all duration-200 focus:outline-none',
            // ✨ ОБНОВЛЕННЫЕ focus состояния с новой цветовой схемой
            'focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20',
            'flex items-center justify-between',
            {
              'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
              'opacity-50 cursor-not-allowed': disabled,
              // ✨ ОБНОВЛЕННЫЙ hover эффект
              'hover:border-primary-400': !disabled && !error,
              // ✨ НОВЫЙ: активное состояние
              'border-primary-500 ring-1 ring-primary-500/20': isOpen && !error,
            }
          )}
        >
          <span className={cn('truncate', {
            'text-dark-400': !selectedOption,
            'text-dark-100': selectedOption,
          })}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-dark-400 transition-transform duration-200', {
              'rotate-180': isOpen,
              // ✨ НОВЫЙ: цвет иконки при активности
              'text-primary-400': isOpen,
            })}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute z-50 w-full mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin',
                // ✨ ОБНОВЛЕННЫЙ фон выпадающего списка
                'bg-dark-800 border border-primary-500/30',
                // ✨ НОВЫЙ: дополнительное свечение для выпадающего списка
                'shadow-primary-glow/50'
              )}
            >
              {options.map((option, index) => (
                <motion.button
                  key={option.value}
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors duration-150',
                    'flex items-center justify-between',
                    {
                      // ✨ ОБНОВЛЕННЫЙ цвет выбранного элемента
                      'bg-primary-500/10 text-primary-400': value === option.value,
                      // ✨ ОБНОВЛЕННЫЙ hover эффект
                      'text-dark-100 hover:bg-primary-500/5 hover:text-primary-300': value !== option.value && !option.disabled,
                      'text-dark-500 cursor-not-allowed': option.disabled,
                      // ✨ НОВЫЙ: дополнительная подсветка активного элемента
                      'border-l-2 border-primary-500': value === option.value,
                    }
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Check className="h-4 w-4 text-primary-400" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 mt-2"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default Select;