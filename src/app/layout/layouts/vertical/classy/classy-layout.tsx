'use client';

import { ReactNode } from 'react';
import ClassicLayout from '../classic/classic-layout';

interface ClassyLayoutProps {
  children: ReactNode;
}

export default function ClassyLayout({ children }: ClassyLayoutProps) {
  // For now, use the classic layout as a base
  // This can be customized later with specific styling
  return <ClassicLayout>{children}</ClassicLayout>;
}
