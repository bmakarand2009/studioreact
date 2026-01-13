import { useCallback } from 'react';
import { sidebarController } from '@/services/sidebarControllerService';
import { MediaAsset } from '@/components/media-slider/types';

export interface MediaSliderOpenOptions {
  onSelect?: (asset: MediaAsset) => void;
  title?: string;
  description?: string;
}

export const useMediaSlider = () => {
  return useCallback(
    (options?: MediaSliderOpenOptions) => {
      sidebarController.open('mediaSlider', options ?? {});
    },
    [],
  );
};


