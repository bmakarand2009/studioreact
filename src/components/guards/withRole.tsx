'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const [hasRedirected, setHasRedirected] = useState(false);
    const [roleCheckComplete, setRoleCheckComplete] = useState(false);

    useEffect(() => {
      const checkRole = async () => {
        if (!isLoading && user && !hasRedirected && !roleCheckComplete) {
          const hasRequiredRole = await hasRole(allowedRoles);
          
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
    }, [user, isLoading, hasRole, allowedRoles, redirectTo, router, hasRedirected, roleCheckComplete]);

    // Show loading while checking auth
    if (isLoading || !roleCheckComplete) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
          </div>
        </div>
      );
    }

    // If user doesn't have required role, don't render
    if (!user) {
      return null;
    }

    // Render the protected component
    return <WrappedComponent {...props} />;
  };
}
