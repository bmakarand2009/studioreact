

import { ReactNode } from 'react';
import ClassicLayout from '../classic/classic-layout';

interface FuturisticLayoutProps {
  children: ReactNode;
}

export default function FuturisticLayout({ children }: FuturisticLayoutProps) {
  // For now, use the classic layout as a base
  // This can be customized later with futuristic styling
  return <ClassicLayout>{children}</ClassicLayout>;
}
