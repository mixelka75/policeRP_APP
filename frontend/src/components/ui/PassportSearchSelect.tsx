// src/components/ui/PassportSearchSelect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, X, ChevronDown } from 'lucide-react';
import { apiService } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { Passport } from '@/types';
import { cn } from '@/utils';

interface PassportOption {
  value: string;
  label: string;
  passport: Passport;
}

interface PassportSearchSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  fullWidth?: boolean;
  className?: string;
}

const PassportSearchSelect: React.FC<PassportSearchSelectProps> = ({
  value = '',
  onChange,
  error,
  placeholder = 'Поиск по имени, никнейму...',
  disabled = false,
  label,
  fullWidth = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] = useState<PassportOption | null>(null);
  const [options, setOptions] = useState<PassportOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { execute: searchPassports, isLoading } = useApi(
    (search: string) => apiService.getPassports({ search, limit: 20 }),
    { showErrorToast: false }
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        try {
          const passports = await searchPassports(searchTerm);
          const newOptions = passports.map((passport: Passport) => ({
            value: passport.id.toString(),
            label: `${passport.first_name} ${passport.last_name} (${passport.nickname})`,
            passport,
          }));
          setOptions(newOptions);
        } catch (error) {
          console.error('Error searching passports:', error);
          setOptions([]);
        }
      } else {
        setOptions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    if (value && !selectedOption) {
      // Найти опцию по значению, если она уже есть в списке
      const option = options.find(opt => opt.value === value);
      if (option) {
        setSelectedOption(option);
        setSearchTerm(option.label);
      }
    } else if (!value && selectedOption) {
      setSelectedOption(null);
      setSearchTerm('');
    }
  }, [value, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    if (!newSearchTerm) {
      setSelectedOption(null);
      onChange('');
      setOptions([]);
    }
    
    setIsOpen(true);
  };

  const handleOptionSelect = (option: PassportOption) => {
    setSelectedOption(option);
    setSearchTerm(option.label);
    onChange(option.value);
    setIsOpen(false);
    setOptions([]);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setSearchTerm('');
    onChange('');
    setOptions([]);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm.length >= 2) {
      // Повторно загружаем опции при фокусе
      searchPassports(searchTerm).then(passports => {
        const newOptions = passports.map((passport: Passport) => ({
          value: passport.id.toString(),
          label: `${passport.first_name} ${passport.last_name} (${passport.nickname})`,
          passport,
        }));
        setOptions(newOptions);
      }).catch(console.error);
    }
  };

  return (
    <div className={cn('relative', { 'w-full': fullWidth }, className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full bg-dark-800 border text-dark-100 placeholder-dark-400 rounded-lg pl-10 pr-10 py-3 text-base transition-all duration-200',
              'focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              {
                'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
                'border-dark-600': !error,
              }
            )}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', {
              'rotate-180': isOpen
            })} />
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (options.length > 0 || isLoading) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {isLoading ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="inline-flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span>Поиск...</span>
                  </div>
                </div>
              ) : options.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  Граждане не найдены
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className="w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-600 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {option.passport.first_name} {option.passport.last_name}
                        </p>
                        <p className="text-gray-400 text-sm truncate">
                          {option.passport.nickname} • {option.passport.city}
                          {option.passport.is_emergency && (
                            <span className="ml-2 text-red-400 font-medium">ЧС</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default PassportSearchSelect;