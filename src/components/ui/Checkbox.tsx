'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded border-2 border-gray-300 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:ring-primary-500 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500',
        error: 'border-error-500 focus:ring-error-500 data-[state=checked]:bg-error-500 data-[state=checked]:border-error-500',
        success: 'border-success-500 focus:ring-success-500 data-[state=checked]:bg-success-500 data-[state=checked]:border-success-500',
        warning: 'border-warning-500 focus:ring-warning-500 data-[state=checked]:bg-warning-500 data-[state=checked]:border-warning-500',
      },
      checkboxSize: {
        default: 'h-4 w-4',
        sm: 'h-3 w-3',
        lg: 'h-5 w-5',
        xl: 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      checkboxSize: 'default',
    },
  }
);

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof checkboxVariants> {
  label?: string;
  message?: string;
  messageType?: 'default' | 'error' | 'success' | 'warning';
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, checkboxSize, label, message, messageType = 'default', ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className={cn(
                checkboxVariants({ variant, checkboxSize }),
                'peer',
                className
              )}
              ref={ref}
              {...props}
            />
            <Check className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-200 peer-data-[state=checked]:opacity-100" />
          </div>
          {label && (
            <label
              htmlFor={props.id}
              className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
        </div>
        {message && (
          <div className="mt-2 flex items-center gap-2">
            {messageType === 'error' && (
              <div className="h-1.5 w-1.5 rounded-full bg-error-500"></div>
            )}
            {messageType === 'success' && (
              <div className="h-1.5 w-1.5 rounded-full bg-success-500"></div>
            )}
            {messageType === 'warning' && (
              <div className="h-1.5 w-1.5 rounded-full bg-warning-500"></div>
            )}
            <p
              className={cn(
                'text-sm',
                messageType === 'error' && 'text-error-600 dark:text-error-400',
                messageType === 'success' && 'text-success-600 dark:text-success-400',
                messageType === 'warning' && 'text-warning-600 dark:text-warning-400',
                messageType === 'default' && 'text-gray-600 dark:text-gray-400'
              )}
            >
              {message}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
