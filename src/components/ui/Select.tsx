'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  onSelect?: (value: string, label: string) => void;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSelect?: (value: string, label: string) => void;
}

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
  children?: React.ReactNode;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, placeholder, disabled, className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value || '');
    const [selectedLabel, setSelectedLabel] = React.useState<string>('');

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
        // Find the label for the selected value
        React.Children.forEach(children, (child) => {
          if (React.isValidElement<SelectContentProps>(child) && child.type === SelectContent) {
            React.Children.forEach(child.props.children, (item) => {
              if (React.isValidElement<SelectItemProps>(item) && item.type === SelectItem && item.props.value === value) {
                setSelectedLabel(String(item.props.children));
              }
            });
          }
        });
      }
    }, [value, children]);

    const handleSelect = (newValue: string, label: string) => {
      setSelectedValue(newValue);
      setSelectedLabel(label);
      setIsOpen(false);
      onValueChange?.(newValue);
    };

    return (
      <div className={cn('relative', className)} ref={ref} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement<SelectTriggerProps>(child) && child.type === SelectTrigger) {
            return React.cloneElement(child, {
              onClick: () => !disabled && setIsOpen(!isOpen),
              disabled,
              'aria-expanded': isOpen,
              'aria-haspopup': 'listbox' as const,
              role: 'combobox' as const,
            } as any);
          }
          if (React.isValidElement<SelectContentProps>(child) && child.type === SelectContent && isOpen) {
            return React.cloneElement(child, {
              onSelect: handleSelect,
            } as any);
          }
          return null;
        })}
      </div>
    );
  }
);

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-deep-500 focus:outline-none focus:ring-1 focus:ring-deep-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-deep-400 dark:focus:ring-deep-400',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 text-gray-400" />
    </button>
  )
);

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, onSelect, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      role="listbox"
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement<SelectItemProps>(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            onSelect,
          } as any);
        }
        return child;
      })}
    </div>
  )
);

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, className, disabled, onSelect, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
        className
      )}
      onClick={() => !disabled && onSelect?.(value, String(children))}
      role="option"
      aria-selected={false}
      {...props}
    >
      {children}
    </div>
  )
);

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, children, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'block truncate',
        !children && 'text-gray-400',
        className
      )}
      {...props}
    >
      {children || placeholder}
    </span>
  )
);

Select.displayName = 'Select';
SelectTrigger.displayName = 'SelectTrigger';
SelectContent.displayName = 'SelectContent';
SelectItem.displayName = 'SelectItem';
SelectValue.displayName = 'SelectValue';

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
