import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-102 active:scale-98',
  {
    variants: {
      variant: {
        // Primary - Deep Blue (Main Action Color)
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-primary hover:shadow-primary-lg active:bg-primary-700 border-0',
        
        // Secondary - Brand Cyan (Secondary Actions)
        secondary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-brand hover:shadow-brand-lg active:bg-brand-700 border-0',
        
        // Tertiary - Brand Orange (Tertiary Actions)
        tertiary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-lg hover:shadow-xl active:bg-secondary-700 border-0',
        
        // Accent - Brand Red (Important Actions)
        accent: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500 shadow-lg hover:shadow-xl active:bg-accent-700 border-0',
        
        // Outline variants with brand colors
        outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-300 bg-transparent',
        
        outlineSecondary: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50 hover:text-brand-700 focus:ring-brand-500 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-300 bg-transparent',
        
        outlineTertiary: 'border-2 border-secondary-500 text-secondary-600 hover:bg-secondary-50 hover:text-secondary-700 focus:ring-secondary-500 dark:border-secondary-400 dark:text-secondary-400 dark:hover:bg-secondary-900/20 dark:hover:text-secondary-300 bg-transparent',
        
        outlineAccent: 'border-2 border-accent-500 text-accent-600 hover:bg-accent-50 hover:text-accent-700 focus:ring-accent-500 dark:border-accent-400 dark:text-accent-400 dark:hover:bg-accent-900/20 dark:hover:text-accent-300 bg-transparent',
        
        // Ghost variants
        ghost: 'text-primary-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-300 bg-transparent',
        
        ghostSecondary: 'text-brand-600 hover:bg-brand-50 hover:text-brand-700 focus:ring-brand-500 dark:text-brand-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-300 bg-transparent',
        
        ghostTertiary: 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-700 focus:ring-secondary-500 dark:text-secondary-400 dark:hover:bg-secondary-900/20 dark:hover:text-secondary-300 bg-transparent',
        
        ghostAccent: 'text-accent-600 hover:bg-accent-50 hover:text-accent-700 focus:ring-accent-500 dark:text-accent-400 dark:hover:bg-accent-900/20 dark:hover:text-accent-300 bg-transparent',
        
        // Destructive
        destructive: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-lg hover:shadow-xl active:bg-error-700 border-0',
        
        // Success
        success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-lg hover:shadow-xl active:bg-success-700 border-0',
        
        // Warning
        warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 shadow-lg hover:shadow-xl active:bg-warning-700 border-0',
        
        // Info
        info: 'bg-info-500 text-white hover:bg-info-600 focus:ring-info-500 shadow-lg hover:shadow-xl active:bg-info-700 border-0',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-md',
        sm: 'h-10 px-4 text-sm rounded-md',
        md: 'h-12 px-6 text-sm rounded-lg',
        lg: 'h-14 px-8 text-base rounded-lg',
        xl: 'h-16 px-10 text-lg rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
