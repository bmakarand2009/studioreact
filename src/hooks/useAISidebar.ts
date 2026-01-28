import { useCallback } from 'react';
import { sidebarController } from '@/services/sidebarControllerService';

export interface AISidebarOpenOptions {
  /**
   * Callback invoked when AI result is applied.
   * Receives the field name and value that should be applied to the form.
   */
  onSelect?: (field: string, value: string) => void;
  targetField?: string;
  features?: string[];
  productDetails?: any;
}

export const useAISidebar = () => {
  return useCallback(
    (options?: AISidebarOpenOptions) => {
      sidebarController.open('aiSidebar', options ?? {});
    },
    [],
  );
};
