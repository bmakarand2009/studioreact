import { ReactNode } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { PreviewProvider } from '@/contexts/PreviewContext';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { AppInitializer } from './AppInitializer';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      <PreviewProvider>
        <ToastProvider>
          <AppInitializer />
          {children}
        </ToastProvider>
      </PreviewProvider>
    </UserProvider>
  );
}
