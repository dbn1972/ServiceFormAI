import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAnnouncer } from '../../hooks/useAnnouncer';

/**
 * Fully accessible modal dialog component
 * WCAG 2.1 AA compliant
 * - Focus trap
 * - Keyboard navigation (Escape to close)
 * - ARIA attributes (role, labelledby, describedby)
 * - Screen reader announcements
 * - Return focus on close
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) {
  const { announce } = useAnnouncer();
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, {
    escapeDeactivates: true,
    returnFocus: true,
    onEscape: onClose,
  });

  // Announce modal open to screen readers
  useEffect(() => {
    if (isOpen) {
      announce(`${title} dialog opened`, 'polite');
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announce]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={dialogRef}
        className={`relative w-full ${sizeClasses[size]} bg-card border border-border rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto`}
        role="document"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 id="modal-title" className="text-2xl font-semibold">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close dialog"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
