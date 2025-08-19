'use client';

import { ReactNode } from 'react';
import ModernLayout from '../modern/modern-layout';

interface CenteredLayoutProps {
  children: ReactNode;
}

export default function CenteredLayout({ children }: CenteredLayoutProps) {
  // For now, use the modern layout as a base
  // This can be customized later with centered content styling
  return <ModernLayout>{children}</ModernLayout>;
}
