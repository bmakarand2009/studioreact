import { ReactNode } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { PreviewProvider } from '@/contexts/PreviewContext';
import { AppInitializer } from './AppInitializer';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      <PreviewProvider>
        <AppInitializer />
        {children}
      </PreviewProvider>
    </UserProvider>
  );
}
