import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  message: string;
  duration?: number;
}

interface ToastMessage extends Required<Omit<ToastOptions, 'duration'>> {
  duration: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? generateId();
      const toast: ToastMessage = {
        id,
        type: options.type ?? 'info',
        message: options.message,
        duration: options.duration ?? DEFAULT_DURATION,
      };

      setToasts(prev => [...prev, toast]);

      if (toast.duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, toast.duration);
      }

      return id;
    },
    [dismissToast],
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast({ type: 'success', message, duration }),
    [showToast],
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast({ type: 'error', message, duration }),
    [showToast],
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast({ type: 'info', message, duration }),
    [showToast],
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast({ type: 'warning', message, duration }),
    [showToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
      success,
      error,
      info,
      warning,
    }),
    [dismissToast, error, info, showToast, success, warning],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => {
          const colorClasses =
            toast.type === 'success'
              ? 'bg-emerald-500 text-emerald-50 shadow-emerald-500/30'
              : toast.type === 'error'
              ? 'bg-red-500 text-red-50 shadow-red-500/30'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-amber-50 shadow-amber-500/30'
              : 'bg-sky-500 text-sky-50 shadow-sky-500/30';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full min-w-[280px] max-w-sm items-start gap-3 rounded-2xl px-5 py-4 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-4 duration-200 ${colorClasses}`}
            >
              <div className="flex-1 leading-5">{toast.message}</div>
              <button
                type="button"
                className="ml-2 text-xs underline decoration-dotted"
                onClick={() => dismissToast(toast.id)}
              >
                Dismiss
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

