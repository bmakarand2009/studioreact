'use client';

import { ReactNode } from 'react';
import ClassicLayout from '../classic/classic-layout';

interface DenseLayoutProps {
  children: ReactNode;
}

export default function DenseLayout({ children }: DenseLayoutProps) {
  // For now, use the classic layout as a base
  // This can be customized later with dense spacing
  return <ClassicLayout>{children}</ClassicLayout>;
}
