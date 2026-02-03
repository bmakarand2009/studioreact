import { ReactNode, createContext, useContext } from 'react';
import {
  useMediaSliderService,
  UseMediaSliderServiceResult,
} from '@/services/mediaSliderService';
import {
  useAISidebarService,
  UseAISidebarServiceResult,
} from '@/services/aiSidebarService';

interface SidebarContextValue {
  mediaSlider: UseMediaSliderServiceResult;
  aiSidebar: UseAISidebarServiceResult;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
}

/**
 * Unified provider for all sidebar components (media slider, AI sidebar, etc.)
 * Manages all sidebar services in a single context
 */
export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const mediaSlider = useMediaSliderService();
  const aiSidebar = useAISidebarService();

  return (
    <SidebarContext.Provider value={{ mediaSlider, aiSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};

// Convenience hooks for accessing specific sidebar services
export const useMediaSliderContext = () => {
  const { mediaSlider } = useSidebarContext();
  return mediaSlider;
};

export const useAISidebarContext = () => {
  const { aiSidebar } = useSidebarContext();
  return aiSidebar;
};
