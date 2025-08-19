'use client';

import { ReactNode } from 'react';
import ClassicLayout from '../classic/classic-layout';

interface CompactLayoutProps {
  children: ReactNode;
}

export default function CompactLayout({ children }: CompactLayoutProps) {
  // For now, use the classic layout as a base
  // This can be customized later with compact navigation styling
  return <ClassicLayout>{children}</ClassicLayout>;
}
