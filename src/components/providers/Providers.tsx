'use client';

import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { AppInitializer } from './AppInitializer';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AppInitializer />
      {children}
    </ThemeProvider>
  );
}
