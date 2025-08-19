'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAppConfig } from '@/hooks/useAppConfig';
import EmptyLayout from './layouts/empty/empty-layout';
import CenteredLayout from './layouts/horizontal/centered/centered-layout';
import EnterpriseLayout from './layouts/horizontal/enterprise/enterprise-layout';
import MaterialLayout from './layouts/horizontal/material/material-layout';
import ModernLayout from './layouts/horizontal/modern/modern-layout';
import WajoobaStudentLayout from './layouts/horizontal/wajooba-student/wajooba-student-layout';
import WajoobaPublicLayout from './layouts/horizontal/wajooba-public/wajooba-public-layout';
import ClassicLayout from './layouts/vertical/classic/classic-layout';
import ClassyLayout from './layouts/vertical/classy/classy-layout';
import CompactLayout from './layouts/vertical/compact/compact-layout';
import DenseLayout from './layouts/vertical/dense/dense-layout';
import FuturisticLayout from './layouts/vertical/futuristic/futuristic-layout';
import ThinLayout from './layouts/vertical/thin/thin-layout';
import WajoobaAdminLayout from './layouts/vertical/wajooba-admin/wajooba-admin-layout';

export interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, colorScheme } = useTheme();
  const { config } = useAppConfig();

  // Determine layout based on route and configuration
  const getLayout = (): string => {
    // Check for layout in query params first
    const layoutFromQuery = searchParams.get('layout');
    if (layoutFromQuery) {
      return layoutFromQuery;
    }

    // Check for layout in route data (you can implement this based on your routing)
    const routeLayout = getRouteLayout(pathname);
    if (routeLayout) {
      return routeLayout;
    }

    // Default to config layout
    return config?.layout || 'wajooba-admin';
  };

  const getRouteLayout = (path: string): string | null => {
    // Define route-specific layouts
    const routeLayouts: Record<string, string> = {
      '/login': 'empty',
      '/forgot-password': 'empty',
      '/sign-up': 'empty',
      '/sign-in': 'empty',
      '/auth': 'empty',
      '/dashboard': 'wajooba-admin',
      '/admin': 'wajooba-admin',
      '/student': 'wajooba-student',
      '/public': 'wajooba-public',
    };

    // Check if path starts with any of the defined routes
    for (const [route, layout] of Object.entries(routeLayouts)) {
      if (path.startsWith(route)) {
        return layout;
      }
    }

    return null;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Update body classes for theme and scheme
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);

    // Update theme classes
    document.body.classList.forEach((className) => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className, className.split('-')[1]);
      }
    });
    document.body.classList.add(colorScheme);
  }, [theme, colorScheme, mounted]);

  if (!mounted) {
    return null;
  }

  const currentLayout = getLayout();

  // Render appropriate layout based on current layout type
  switch (currentLayout) {
    case 'empty':
      return <EmptyLayout>{children}</EmptyLayout>;

    // Horizontal layouts
    case 'centered':
      return <CenteredLayout>{children}</CenteredLayout>;
    case 'enterprise':
      return <EnterpriseLayout>{children}</EnterpriseLayout>;
    case 'material':
      return <MaterialLayout>{children}</MaterialLayout>;
    case 'modern':
      return <ModernLayout>{children}</ModernLayout>;
    case 'wajooba-student':
      return <WajoobaStudentLayout>{children}</WajoobaStudentLayout>;
    case 'wajooba-public':
      return <WajoobaPublicLayout>{children}</WajoobaPublicLayout>;

    // Vertical layouts
    case 'classic':
      return <ClassicLayout>{children}</ClassicLayout>;
    case 'classy':
      return <ClassyLayout>{children}</ClassyLayout>;
    case 'compact':
      return <CompactLayout>{children}</CompactLayout>;
    case 'dense':
      return <DenseLayout>{children}</DenseLayout>;
    case 'futuristic':
      return <FuturisticLayout>{children}</FuturisticLayout>;
    case 'thin':
      return <ThinLayout>{children}</ThinLayout>;
    case 'wajooba-admin':
    default:
      return <WajoobaAdminLayout>{children}</WajoobaAdminLayout>;
  }
}
