'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/contexts/PreviewContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface WithRoleProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { allowedRoles, redirectTo }: WithRoleProps
) {
  return function WithRoleComponent(props: P) {
    const { user, isLoading, hasRole } = useAuth();
    const { isInPreviewMode, previewUser } = usePreview();
    const router = useRouter();
    const pathname = usePathname();
    const [hasRedirected, setHasRedirected] = useState(false);
    const [roleCheckComplete, setRoleCheckComplete] = useState(false);

    useEffect(() => {
      const checkRole = async () => {
        if (!isLoading && user && !hasRedirected && !roleCheckComplete) {
          let hasRequiredRole = false;
          
          // If in preview mode, check if the preview user has the required role
          if (isInPreviewMode && previewUser) {
            hasRequiredRole = allowedRoles.includes(previewUser.role);
          } else {
            // Check the actual user's role
            hasRequiredRole = await hasRole(allowedRoles);
          }
          
          if (!hasRequiredRole) {
            setHasRedirected(true);
            
            // Redirect based on user role
            if (redirectTo) {
              router.push(redirectTo);
            } else {
              // Default role-based redirects
              switch (user.role) {
                case 'ROLE_ADMIN':
                  router.push('/admin/dashboard');
                  break;
                case 'ROLE_STUDENT':
                  router.push('/student/dashboard');
                  break;
                case 'ROLE_STAFF':
                  router.push('/staff/dashboard');
                  break;
                default:
                  router.push('/dashboard');
                  break;
              }
            }
          }
          
          setRoleCheckComplete(true);
        }
      };

      checkRole();
    }, [user, isLoading, hasRole, allowedRoles, redirectTo, router, hasRedirected, roleCheckComplete, isInPreviewMode, previewUser]);

    // Show loading while checking auth OR while role check is incomplete
    if (isLoading || !roleCheckComplete) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {isLoading ? 'Loading...' : 'Checking permissions...'}
            </p>
          </div>
        </div>
      );
    }

    // If no user and not in preview mode, redirect to login with current page as redirect URL
    if (!user && !isInPreviewMode) {
      // Redirect to login with current page as redirect parameter
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
      return null;
    }

    // Render the protected component
    return <WrappedComponent {...props} />;
  };
}
