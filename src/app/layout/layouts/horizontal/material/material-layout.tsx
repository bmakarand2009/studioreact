

import { ReactNode } from 'react';
import ModernLayout from '../modern/modern-layout';

interface MaterialLayoutProps {
  children: ReactNode;
}

export default function MaterialLayout({ children }: MaterialLayoutProps) {
  // For now, use the modern layout as a base
  // This can be customized later with Material Design styling
  return <ModernLayout>{children}</ModernLayout>;
}
