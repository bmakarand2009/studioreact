import { ReactNode, createContext, useContext } from 'react';
import {
  useMediaSliderService,
  UseMediaSliderServiceResult,
} from '@/services/mediaSliderService';

const MediaSliderContext = createContext<UseMediaSliderServiceResult | null>(null);

interface MediaSliderProviderProps {
  children: ReactNode;
}

export const MediaSliderProvider = ({ children }: MediaSliderProviderProps) => {
  const service = useMediaSliderService();
  return <MediaSliderContext.Provider value={service}>{children}</MediaSliderContext.Provider>;
};

export const useMediaSliderContext = () => {
  const context = useContext(MediaSliderContext);
  if (!context) {
    throw new Error('useMediaSliderContext must be used within a MediaSliderProvider');
  }
  return context;
};


