// src/components/ui/ActionsDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

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
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  actions,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  size = 'sm',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 text-gray-400 hover:text-gray-100 transition-colors rounded-md hover:bg-gray-800 ${buttonClassName}`}
        title="Действия"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className={`absolute z-50 mt-2 ${
              align === 'right' ? 'right-0' : 'left-0'
            } bg-dark-800 border border-dark-600 rounded-lg shadow-lg min-w-48 ${dropdownClassName}`}
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionsDropdown;