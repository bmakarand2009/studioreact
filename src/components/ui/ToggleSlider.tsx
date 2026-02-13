import * as React from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUCCESS_DISPLAY_MS = 1200;

export interface ToggleSliderProps {
  /** Controlled checked state */
  checked: boolean;
  /** Called when user toggles. May return a Promise; thumb shows loading until it resolves, then shows success checkmark briefly */
  onCheckedChange: (checked: boolean) => void | Promise<void>;
  disabled?: boolean;
  /** Merged with the root button; can override track colours (e.g. className="bg-gray-400" when off) */
  className?: string;
  /** Accessible label for the switch */
  'aria-label'?: string;
  /** Text shown to the right when toggle is on */
  labelOn?: string;
  /** Text shown to the right when toggle is off */
  labelOff?: string;
}

const ToggleSlider = React.forwardRef<HTMLButtonElement, ToggleSliderProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled = false,
      className,
      'aria-label': ariaLabel = 'Toggle',
      labelOn,
      labelOff,
      ...props
    },
    ref
  ) => {
    const [loading, setLoading] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearSuccessTimeout = React.useCallback(() => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    }, []);

    React.useEffect(() => {
      return clearSuccessTimeout;
    }, [clearSuccessTimeout]);

    const handleClick = React.useCallback(() => {
      if (disabled || loading) return;
      const nextChecked = !checked;
      setLoading(true);
      setShowSuccess(false);
      clearSuccessTimeout();

      const result = onCheckedChange(nextChecked);
      const promise = result instanceof Promise ? result : Promise.resolve();

      promise
        .then(() => {
          setLoading(false);
          setShowSuccess(true);
          successTimeoutRef.current = setTimeout(() => {
            setShowSuccess(false);
            successTimeoutRef.current = null;
          }, SUCCESS_DISPLAY_MS);
        })
        .catch(() => {
          setLoading(false);
          setShowSuccess(false);
        });
    }, [checked, disabled, loading, onCheckedChange, clearSuccessTimeout]);

    const thumbContent = loading ? (
      <Loader2
        className="h-3 w-3 shrink-0 animate-spin text-slate-600 dark:text-slate-300"
        aria-hidden
      />
    ) : showSuccess ? (
      <Check
        className={cn(
          'h-3 w-3 shrink-0 animate-scale-in',
          checked
            ? 'text-primary-500 dark:text-primary-500'
            : 'text-slate-500 dark:text-slate-400'
        )}
        strokeWidth={2.5}
        aria-hidden
      />
    ) : null;

    const showLabel = labelOn !== undefined || labelOff !== undefined;
    const labelText = checked ? (labelOn ?? '') : (labelOff ?? '');

    const buttonEl = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-busy={loading}
        disabled={disabled || loading}
        onClick={handleClick}
        className={cn(
          'relative inline-flex h-5 w-8 shrink-0 items-center rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed',
          checked
            ? 'bg-primary-500 dark:bg-primary-500'
            : 'bg-gray-300 dark:bg-gray-600',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'absolute top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-0 transition-[left] duration-200 ease-out',
            checked ? 'left-[14px]' : 'left-[2px]'
          )}
        >
          {thumbContent}
        </span>
      </button>
    );

    if (showLabel) {
      return (
        <span className="inline-flex items-center gap-2">
          {buttonEl}
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {labelText}
          </span>
        </span>
      );
    }

    return buttonEl;
  }
);

ToggleSlider.displayName = 'ToggleSlider';

export { ToggleSlider };
