

import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/contexts/PreviewContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const [hasRedirected, setHasRedirected] = useState(false);
    const [roleCheckComplete, setRoleCheckComplete] = useState(false);

    useEffect(() => {
      const checkRole = async () => {
        if (!isLoading && user && !hasRedirected && !roleCheckComplete) {
          let hasRequiredRole = false;
          
          // If in preview mode, check if the preview user has the required role
          if (isInPreviewMode && previewUser) {
            // Normalize preview user role for comparison
            const normalizedPreviewRole = (previewUser.role || '').toUpperCase();
            hasRequiredRole = allowedRoles.some(role => {
              const normalized = role.toUpperCase();
              return normalizedPreviewRole === normalized || 
                     normalizedPreviewRole === `ROLE_${normalized}` ||
                     `ROLE_${normalizedPreviewRole}` === normalized;
            });
          } else {
            // Check the actual user's role
            hasRequiredRole = await hasRole(allowedRoles);
          }
          
          if (!hasRequiredRole) {
            setHasRedirected(true);
            
            // Redirect based on user role
            if (redirectTo) {
              navigate(redirectTo);
            } else {
              // Default role-based redirects
              const normalizedRole = (user.role || '').toUpperCase();
              switch (normalizedRole) {
                case 'ROLE_ADMIN':
                case 'ADMIN':
                case 'ROLE_STAFF':
                case 'STAFF':
                  navigate('/admin/dashboard');
                  break;
                case 'ROLE_STUDENT':
                case 'STUDENT':
                  navigate('/student/dashboard');
                  break;
                default:
                  navigate('/dashboard');
                  break;
              }
            }
          }
          
          setRoleCheckComplete(true);
        }
      };

      checkRole();
    }, [user, isLoading, hasRole, allowedRoles, redirectTo, navigate, hasRedirected, roleCheckComplete, isInPreviewMode, previewUser]);

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
      navigate(redirectUrl);
      return null;
    }

    // Render the protected component
    return <WrappedComponent {...props} />;
  };
}
