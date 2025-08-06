// src/components/ui/ActionsMobileModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ActionItem } from './ActionsDropdown';

interface ActionsMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ActionItem[];
  title?: string;
}

export const ActionsMobileModal: React.FC<ActionsMobileModalProps> = ({
  isOpen,
  onClose,
  actions,
  title = 'Действия'
}) => {
  const visibleActions = actions.filter(action => !action.hidden);

  const handleActionClick = (action: ActionItem) => {
    if (!action.disabled) {
      action.onClick();
      onClose();
    }
  };

  const getColorClasses = (color: ActionItem['color'] = 'primary') => {
    const colorMap = {
      primary: 'text-primary-400',
      secondary: 'text-secondary-400',
      danger: 'text-red-400',
      success: 'text-green-400',
      warning: 'text-yellow-400',
      accent: 'text-accent-400'
    };
    return colorMap[color];
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          className="fixed bottom-0 left-0 right-0 bg-dark-800 rounded-t-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-600">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-100 transition-colors rounded-lg hover:bg-dark-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="p-2 pb-safe max-h-96 overflow-y-auto">
            {visibleActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={`
                    w-full p-4 flex items-center space-x-4 text-left rounded-xl transition-colors
                    ${action.disabled 
                      ? 'text-gray-500 cursor-not-allowed opacity-50' 
                      : 'text-gray-100 hover:bg-dark-700 active:bg-dark-600'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg bg-dark-700 ${getColorClasses(action.color)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{action.label}</p>
                    {action.title && action.title !== action.label && (
                      <p className="text-sm text-gray-400 mt-0.5">{action.title}</p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Safe area padding for iPhone */}
          <div className="pb-safe" />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ActionsMobileModal;