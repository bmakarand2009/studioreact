

import { ReactNode } from 'react';
import ClassicLayout from '../classic/classic-layout';

interface ThinLayoutProps {
  children: ReactNode;
}

export default function ThinLayout({ children }: ThinLayoutProps) {
  // For now, use the classic layout as a base
  // This can be customized later with thin navigation styling
  return <ClassicLayout>{children}</ClassicLayout>;
}
