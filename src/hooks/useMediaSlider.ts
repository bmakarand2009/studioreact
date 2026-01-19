import { useCallback } from 'react';
import { sidebarController } from '@/services/sidebarControllerService';

export interface MediaSliderOpenOptions {
  /**
   * Callback invoked when an image is selected or uploaded.
   * Receives the Cloudinary public ID (string) that can be stored directly in form fields.
   */
  onSelect?: (publicId: string) => void;
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


