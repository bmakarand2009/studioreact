import { ReactNode, useMemo } from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { useAISidebar, AISidebarOpenOptions } from '@/hooks/useAISidebar';
import { Sparkles } from 'lucide-react';

interface AISidebarLauncherProps extends Omit<Partial<ButtonProps>, 'onSelect'> {
  children?: ReactNode;
  label?: string;
  targetField?: string;
  features?: string[];
  productDetails?: any;
  onSelect?: AISidebarOpenOptions['onSelect'];
}

export const AISidebarLauncher = ({
  children,
  label = 'AI Assistant',
  targetField,
  features,
  productDetails,
  onSelect,
  disabled,
  size = 'sm',
  variant = 'secondary',
  ...buttonProps
}: AISidebarLauncherProps) => {
  const openSidebar = useAISidebar();

  const EffectiveLabel = useMemo(() => children ?? label, [children, label]);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={disabled}
      onClick={() =>
        openSidebar({
          onSelect,
          targetField,
          features,
          productDetails,
        })
      }
      {...buttonProps}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {EffectiveLabel}
    </Button>
  );
};

export default AISidebarLauncher;
