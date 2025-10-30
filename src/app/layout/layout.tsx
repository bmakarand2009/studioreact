

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import EmptyLayout from './layouts/empty/empty-layout';
import WajoobaPublicLayout from './layouts/horizontal/wajooba-public/wajooba-public-layout';
import WajoobaStudentLayout from './layouts/vertical/wajooba-student/wajooba-student-layout';
import WajoobaAdminLayout from './layouts/vertical/wajooba-admin/wajooba-admin-layout';
import { useRef } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout router that dynamically selects and renders different layouts
 * based on route paths or query parameters
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { isLoading, user } = useAuth();
  const layout = getRouteLayout(pathname);

  // Use ref to track previous values and detect changes
  const prevValuesRef = useRef({ pathname, isLoading, hasUser: !!user, layout });

  // Check what changed
  const prevValues = prevValuesRef.current;
  if (prevValues.pathname !== pathname || 
      prevValues.isLoading !== isLoading || 
      prevValues.hasUser !== !!user || 
      prevValues.layout !== layout) {
    prevValuesRef.current = { pathname, isLoading, hasUser: !!user, layout };
  }

  // Show loading state only when necessary
  // Only show loading when checking for auth tokens on the root route
  const shouldShowLoading = isLoading && pathname === '/';

  // Additional check: if we have a user, we should never show loading
  if (user && isLoading) {
    console.warn('Layout: WARNING - User exists but still loading! This should not happen.');
  }

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate layout based on the route
  switch (layout) {
    case 'empty':
      return <EmptyLayout>{children}</EmptyLayout>;
    case 'wajooba-public':
      return <WajoobaPublicLayout>{children}</WajoobaPublicLayout>;
    case 'wajooba-admin':
      return <WajoobaAdminLayout>{children}</WajoobaAdminLayout>;
    case 'wajooba-student':
      return <WajoobaStudentLayout>{children}</WajoobaStudentLayout>;
    default:
      // Default to public layout for unknown routes
      return <WajoobaPublicLayout>{children}</WajoobaPublicLayout>;
  }
}

/**
 * Determine which layout to use based on the current route
 */
const getRouteLayout = (path: string): string | null => {
  // Define route-specific layouts - order matters for matching!
  const routeLayouts: Record<string, string> = {
    // Auth routes - use empty layout
    '/login': 'empty',
    '/forgot-password': 'empty',
    '/sign-up': 'empty',
    '/sign-in': 'empty',
    '/auth': 'empty',
    
    // Student routes - use student layout (MUST come before public routes)
    '/student': 'wajooba-student',
    '/student/dashboard': 'wajooba-student',
    '/student/courses': 'wajooba-student',
    '/student/calendar': 'wajooba-student',
    '/student/store': 'wajooba-student',
    '/student/assessments': 'wajooba-student',
    '/student/assignments': 'wajooba-student',
    '/student/grades': 'wajooba-student',
    
    // Admin routes - use admin layout
    '/admin': 'wajooba-admin',
    '/admin/dashboard': 'wajooba-admin',
    '/admin/users': 'wajooba-admin',
    '/admin/courses': 'wajooba-admin',
    '/admin/settings': 'wajooba-admin',
    
    // Staff routes - use admin layout  
    '/staff': 'wajooba-admin',
    '/staff/dashboard': 'wajooba-admin',
    
    // Public routes - use public layout (MUST come after specific routes)
    '/': 'wajooba-public',
    '/courses': 'wajooba-public',
    '/contact': 'wajooba-public',
    '/about': 'wajooba-public',
    '/pricing': 'wajooba-public',
    '/features': 'wajooba-public',
    
    // Generic dashboard - redirects based on role
    '/dashboard': 'wajooba-admin',
  };

  // Check if path starts with any of the defined routes
  // We need to check more specific routes first
  const sortedRoutes = Object.entries(routeLayouts).sort((a, b) => {
    // Sort by route length (longer routes first) to ensure specific matches
    return b[0].length - a[0].length;
  });

  for (const [route, layout] of sortedRoutes) {
    if (path.startsWith(route)) {
      return layout;
    }
  }

  return null;
};
