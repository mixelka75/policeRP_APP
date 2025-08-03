// src/components/ui/Modal.tsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { usePortal } from '@/hooks/usePortal';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) => {
  console.log('=== Modal Render ===');
  console.log('isOpen:', isOpen);
  console.log('title:', title);
  console.log('size:', size);
  
  const portalRoot = usePortal('modal-root');
  console.log('portalRoot:', portalRoot);

  useEffect(() => {
    if (!closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, onClose, closeOnEsc]);

  const sizeClasses = cn({
    'max-w-sm': size === 'sm',
    'max-w-md': size === 'md',
    'max-w-lg': size === 'lg',
    'max-w-2xl': size === 'xl',
  });

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ display: 'flex' }}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-dark-800/80 backdrop-blur-md rounded-xl border border-dark-600/50 shadow-2xl',
          sizeClasses
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 10000 }}
      >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-600/50">
              <h2 className="text-lg font-semibold text-dark-100">
                {title}
              </h2>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="!p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  ) : null;

  console.log('Modal - about to render:', { portalRoot: !!portalRoot, modalContent: !!modalContent });
  
  // If portalRoot is not available, render directly to body as fallback
  if (!portalRoot && modalContent) {
    console.log('Portal root not available, rendering fallback');
    return modalContent;
  }
  
  return portalRoot ? createPortal(modalContent, portalRoot) : null;
};

export default Modal;