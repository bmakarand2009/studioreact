

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { 
  AlertCircleIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  InfoIcon,
  XIcon
} from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-fuse border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-error/50 text-error dark:border-error [&>svg]:text-error',
        success: 'border-success/50 text-success dark:border-success [&>svg]:text-success',
        warning: 'border-warning/50 text-warning dark:border-warning [&>svg]:text-warning',
        info: 'border-info/50 text-info dark:border-info [&>svg]:text-info',
      },
      appearance: {
        default: 'bg-background',
        outline: 'bg-transparent',
        filled: 'border-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      appearance: 'default',
    },
  }
);

const alertAppearanceStyles = {
  default: {
    default: 'bg-background',
    destructive: 'bg-error/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    info: 'bg-info/10',
  },
  outline: {
    default: 'bg-transparent',
    destructive: 'bg-transparent',
    success: 'bg-transparent',
    warning: 'bg-transparent',
    info: 'bg-transparent',
  },
  filled: {
    default: 'bg-gray-900 text-white',
    destructive: 'bg-error text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    info: 'bg-info text-white',
  },
};

const iconMap = {
  default: InfoIcon,
  destructive: AlertCircleIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, appearance, showIcon = true, onClose, children, ...props }, ref) => {
    const Icon = iconMap[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          alertVariants({ variant, appearance }),
          appearance === 'filled' && variant && alertAppearanceStyles.filled[variant],
          appearance === 'default' && variant && alertAppearanceStyles.default[variant],
          className
        )}
        {...props}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
