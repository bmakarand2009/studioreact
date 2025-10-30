

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'w-full rounded-lg border-2 bg-white px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-gray-600 dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
        error: 'border-error-500 focus:border-error-500 focus:ring-error-500/20 dark:border-error-400 dark:focus:border-error-400 dark:focus:ring-error-400/20',
        success: 'border-success-500 focus:border-success-500 focus:ring-success-500/20 dark:border-success-400 dark:focus:border-success-400 dark:focus:ring-success-400/20',
        warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20 dark:border-warning-400 dark:focus:border-warning-400 dark:focus:ring-warning-400/20',
      },
      inputSize: {
        default: 'h-10 px-3 py-2 text-sm',
        sm: 'h-8 px-2 py-1 text-xs',
        lg: 'h-12 px-4 py-3 text-sm',
        xl: 'h-14 px-6 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode; // Alias for leftIcon for compatibility
  message?: string;
  messageType?: 'default' | 'error' | 'success' | 'warning';
  error?: string; // Alias for error message
  label?: string; // Label for the input
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, leftIcon, rightIcon, icon, message, messageType = 'default', error, label, ...props }, ref) => {
    // Use icon as leftIcon if provided
    const finalLeftIcon = icon || leftIcon;
    // Use error as message if provided
    const finalMessage = error || message;
    const finalMessageType = error ? 'error' : messageType;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {finalLeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 dark:text-gray-400">
              {finalLeftIcon}
            </div>
          )}
          <input
            className={cn(
              inputVariants({ variant, inputSize, className }),
              finalLeftIcon && 'pl-12',
              rightIcon && 'pr-12'
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 dark:text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {finalMessage && (
          <div className="mt-2 flex items-center gap-2">
            {finalMessageType === 'error' && (
              <div className="h-1.5 w-1.5 rounded-full bg-error-500"></div>
            )}
            {finalMessageType === 'success' && (
              <div className="h-1.5 w-1.5 rounded-full bg-success-500"></div>
            )}
            {finalMessageType === 'warning' && (
              <div className="h-1.5 w-1.5 rounded-full bg-warning-500"></div>
            )}
            <p
              className={cn(
                'text-sm',
                finalMessageType === 'error' && 'text-error-600 dark:text-error-400',
                finalMessageType === 'success' && 'text-success-600 dark:text-success-400',
                finalMessageType === 'warning' && 'text-warning-600 dark:text-warning-400',
                finalMessageType === 'default' && 'text-gray-600 dark:text-gray-400'
              )}
            >
              {finalMessage}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
