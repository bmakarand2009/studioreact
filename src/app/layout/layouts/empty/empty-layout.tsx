

import { ReactNode } from 'react';

interface EmptyLayoutProps {
  children: ReactNode;
}

export default function EmptyLayout({ children }: EmptyLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Just render the children directly - no wrapper, no branding, no containers */}
      {children}
    </div>
  );
}
