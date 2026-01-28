import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export type ConfirmationDialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: (confirmed: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationDialogVariant;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const variantConfig: Record<ConfirmationDialogVariant, { icon: typeof AlertTriangle; iconColor: string; buttonVariant: 'primary' | 'accent' | 'warning' | 'success' }> = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-600 dark:text-red-400',
    buttonVariant: 'accent',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    buttonVariant: 'warning',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonVariant: 'primary',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    buttonVariant: 'success',
  },
};

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) => {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose(true);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              variant === 'danger'
                ? 'bg-red-100 dark:bg-red-900/30'
                : variant === 'warning'
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : variant === 'info'
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}
          >
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={config.buttonVariant}
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
