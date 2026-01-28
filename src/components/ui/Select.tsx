

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

    // Extract items from SelectContent to find labels even when dropdown is closed
    // Use a ref to store the items map to avoid recreating it on every render
    const itemsMapRef = React.useRef<Map<string, string>>(new Map());
    
    React.useEffect(() => {
      const map = new Map<string, string>();
      React.Children.forEach(children, (child) => {
        if (React.isValidElement<SelectContentProps>(child) && child.type === SelectContent) {
          React.Children.forEach(child.props.children, (item) => {
            if (React.isValidElement<SelectItemProps>(item) && item.type === SelectItem) {
              map.set(item.props.value, String(item.props.children));
            }
          });
        }
      });
      itemsMapRef.current = map;
    }, [children]);

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue((prev) => prev !== value ? value : prev);
        // Find the label from the items map
        const label = itemsMapRef.current.get(value);
        // Use functional update to avoid stale closure issues
        setSelectedLabel((prev) => {
          if (label !== undefined && label !== prev) {
            return label;
          }
          if (label === undefined && prev !== '') {
            return '';
          }
          return prev; // No change needed
        });
      } else {
        setSelectedValue((prev) => prev !== '' ? '' : prev);
        setSelectedLabel((prev) => prev !== '' ? '' : prev);
      }
    }, [value]); // Only depend on value to avoid loops

    const handleSelect = React.useCallback((newValue: string, label: string) => {
      setSelectedValue(newValue);
      setSelectedLabel(label);
      setIsOpen(false);
      onValueChange?.(newValue);
    }, [onValueChange]);

    // Memoize the processed children to avoid recalculating on every render
    const processedTriggerChildren = React.useMemo(() => {
      // Helper to recursively update SelectValue with selectedLabel
      const updateSelectValue = (node: React.ReactNode): React.ReactNode => {
        return React.Children.map(node, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === SelectValue) {
              // Update SelectValue with selectedLabel if available, otherwise keep original children
              const valueProps = child.props as SelectValueProps;
              const newChildren = selectedLabel || valueProps.children || valueProps.placeholder;
              // Only clone if the children actually changed
              if (newChildren !== valueProps.children) {
                return React.cloneElement(child as React.ReactElement<SelectValueProps>, {
                  children: newChildren,
                });
              }
              return child;
            }
            // Recursively process children
            const childProps = child.props as { children?: React.ReactNode };
            if (childProps.children) {
              const updatedChildren = updateSelectValue(childProps.children);
              // Only clone if children changed
              if (updatedChildren !== childProps.children) {
                return React.cloneElement(child, {
                  children: updatedChildren,
                } as any);
              }
            }
          }
          return child;
        });
      };

      // Find SelectTrigger and process its children
      let triggerChildren: React.ReactNode = null;
      React.Children.forEach(children, (child) => {
        if (React.isValidElement<SelectTriggerProps>(child) && child.type === SelectTrigger) {
          triggerChildren = child.props.children;
        }
      });
      
      return triggerChildren ? updateSelectValue(triggerChildren) : triggerChildren;
    }, [children, selectedLabel]);

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
              children: processedTriggerChildren,
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
