'use client';

import { ReactNode } from 'react';
import ModernLayout from '../modern/modern-layout';

interface EnterpriseLayoutProps {
  children: ReactNode;
}

export default function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  // For now, use the modern layout as a base
  // This can be customized later with enterprise-specific styling
  return <ModernLayout>{children}</ModernLayout>;
}
