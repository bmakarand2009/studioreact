import { useEffect, useRef } from 'react';
import { appLoadService } from '@/app/core/app-load';
import { authService } from '@/services/authService';
import { useUIStore } from '@/stores/uiStore';

export function AppInitializer() {
  // Use ref to prevent multiple initializations
  const hasInitializedRef = useRef(false);
  const { theme } = useUIStore();
  
  // Apply theme class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  
  const initializeApp = async () => {
    try {
      console.log('AppInitializer: Starting app initialization...');
      
      // Initialize app configuration (tenant details) - don't block on failure
      const tenantDetails = await appLoadService.initAppConfig().catch((error) => {
        console.warn('AppInitializer: Tenant details fetch failed, continuing anyway:', error);
        return null;
      });
      
      if (!tenantDetails) {
        console.warn('AppInitializer: No tenant details, but continuing app load');
        return;
      }
      
      console.log('AppInitializer: Successfully initialized with tenant details');
      
      // Check for auth tokens - don't block on failure
      console.log('AppInitializer: Checking for auth tokens...');
      const authTokenSuccess = await authService.checkAuthTokenInUrl().catch((error) => {
        console.warn('AppInitializer: Auth token check failed:', error);
        return false;
      });
      
      if (authTokenSuccess) {
        console.log('AppInitializer: Auth token found and validated');
        // Get user details to determine redirect path
        const user = await authService.getCurrentUser().catch(() => null);
        if (user) {
          // Determine redirect path based on user role
          let redirectPath = '/';
          const userRole = user.role || '';
          
          const normalizedRole = userRole.toUpperCase();
          if (normalizedRole === 'ROLE_ADMIN' || normalizedRole === 'ADMIN' || normalizedRole === 'ROLE_STAFF' || normalizedRole === 'STAFF') {
            redirectPath = '/admin/dashboard';
          } else if (normalizedRole === 'ROLE_STUDENT' || normalizedRole === 'STUDENT') {
            redirectPath = '/student/dashboard';
          }
          
          console.log(`AppInitializer: Redirecting user with role '${userRole}' to: ${redirectPath}`);
          window.location.replace(redirectPath);
        }
      }
      
      console.log('AppInitializer: App initialization complete');
      
    } catch (error) {
      console.error('AppInitializer: Initialization error (non-blocking):', error);
      // Continue - don't block the app from rendering
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    // Run initialization in background without blocking render
    initializeApp();
  }, []);

  // This component doesn't render anything - it just runs initialization logic
  return null;
}
