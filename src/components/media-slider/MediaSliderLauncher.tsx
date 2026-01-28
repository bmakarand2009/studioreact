import { ReactNode, useMemo } from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { useMediaSlider, MediaSliderOpenOptions } from '@/hooks/useMediaSlider';
import { useMediaSliderContext } from '@/components/sidebars/SidebarProvider';

interface MediaSliderLauncherProps extends Omit<Partial<ButtonProps>, 'onSelect'> {
  children?: ReactNode;
  label?: string;
  title?: string;
  description?: string;
  onSelect?: MediaSliderOpenOptions['onSelect'];
}

export const MediaSliderLauncher = ({
  children,
  label = 'Open media library',
  title,
  description,
  onSelect,
  disabled,
  size = 'sm',
  variant = 'secondary',
  ...buttonProps
}: MediaSliderLauncherProps) => {
  const openSlider = useMediaSlider();
  const { isUploading } = useMediaSliderContext();

  const EffectiveLabel = useMemo(() => children ?? label, [children, label]);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={disabled || isUploading}
      onClick={() =>
        openSlider({
          onSelect,
          title,
          description,
        })
      }
      {...buttonProps}
    >
      {EffectiveLabel}
    </Button>
  );
};

export default MediaSliderLauncher;


