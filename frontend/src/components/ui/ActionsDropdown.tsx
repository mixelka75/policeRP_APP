// src/components/ui/ActionsDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ActionsMobileModal } from './ActionsMobileModal';

export interface ActionItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'accent';
  disabled?: boolean;
  hidden?: boolean;
  title?: string;
}

interface ActionsDropdownProps {
  actions: ActionItem[];
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'icon' | 'button';
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  actions,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  size = 'sm',
  align = 'right',
  label = 'Действия',
  icon: IconComponent = Settings,
  variant = 'button'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  // Фильтруем скрытые действия
  const visibleActions = actions.filter(action => !action.hidden);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleActionClick = (action: ActionItem) => {
    if (!action.disabled) {
      action.onClick();
      setIsOpen(false);
    }
  };

  const getColorClasses = (color: ActionItem['color'] = 'primary') => {
    const colorMap = {
      primary: 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/10',
      secondary: 'text-secondary-400 hover:text-secondary-300 hover:bg-secondary-500/10',
      danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
      success: 'text-green-400 hover:text-green-300 hover:bg-green-500/10',
      warning: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10',
      accent: 'text-accent-400 hover:text-accent-300 hover:bg-accent-500/10'
    };
    return colorMap[color];
  };

  const dropdownAnimation = {
    initial: { opacity: 0, scale: 0.95, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 }
  };

  const itemAnimation = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  };

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => {
          if (isMobile) {
            setIsMobileModalOpen(true);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`
          ${variant === 'icon' 
            ? 'p-2 text-gray-400 hover:text-gray-100 transition-colors rounded-md hover:bg-gray-800'
            : 'px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white border border-dark-600 rounded-lg transition-colors flex items-center space-x-2'
          }
          ${buttonClassName}
        `}
        title={label}
      >
        {variant === 'icon' ? (
          <IconComponent className="h-4 w-4" />
        ) : (
          <>
            <IconComponent className="h-4 w-4" />
            <span>{label}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            className={`fixed z-[9999] bg-dark-800 border border-dark-600 rounded-lg shadow-xl min-w-48 max-h-64 overflow-y-auto ${dropdownClassName}`}
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
              [align === 'right' ? 'right' : 'left']: align === 'right'
                ? window.innerWidth - (buttonRef.current?.getBoundingClientRect().right || 0)
                : buttonRef.current?.getBoundingClientRect().left || 0
            }}
            {...dropdownAnimation}
            transition={{ duration: 0.15 }}
          >
            <div className="py-1">
              {visibleActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    key={action.key}
                    {...itemAnimation}
                    transition={{ delay: index * 0.05, duration: 0.1 }}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    title={action.title || action.label}
                    className={`
                      w-full px-4 py-2 text-left flex items-center space-x-3 text-sm
                      transition-colors duration-150
                      ${action.disabled 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : getColorClasses(action.color)
                      }
                      disabled:opacity-50
                    `}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Mobile Modal */}
      <ActionsMobileModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        actions={visibleActions}
        title={label}
      />
    </div>
  );
};

export default ActionsDropdown;