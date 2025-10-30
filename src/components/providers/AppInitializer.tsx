import { useEffect, useRef } from 'react';
import { appLoadService } from '@/app/core/app-load';
import { authService } from '@/services/authService';

export function AppInitializer() {
  // Use ref to prevent multiple initializations
  const hasInitializedRef = useRef(false);
  
  const initializeApp = async () => {
    try {
      console.log('AppInitializer: Starting app initialization...');
      
      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 10000)
      );
      
      // Initialize app configuration (tenant details) with timeout
      const tenantDetails = await Promise.race([
        appLoadService.initAppConfig(),
        timeout
      ]).catch((error) => {
        console.warn('AppInitializer: Tenant details fetch failed, continuing anyway:', error);
        return null;
      });
      
      if (!tenantDetails) {
        console.warn('AppInitializer: No tenant details, but continuing app load');
        return;
      }
      
      console.log('AppInitializer: Successfully initialized with tenant details');
      
      // Now that app is initialized, check for auth tokens
      console.log('AppInitializer: Checking for auth tokens...');
      console.log('AppInitializer: Current URL:', window.location.href);
      console.log('AppInitializer: URL search params:', window.location.search);
      
      const authTokenSuccess = await authService.checkAuthTokenInUrl();
      
      if (authTokenSuccess) {
        console.log('AppInitializer: Auth token found and validated');
        // Get user details to determine redirect path
        const user = await authService.getCurrentUser();
        if (user) {
          // Determine redirect path based on user role
          let redirectPath = '/';
          const userRole = user.role || '';
          
          if (userRole === 'ROLE_ADMIN' || userRole === 'admin' || userRole === 'ROLE_STAFF' || userRole === 'staff') {
            redirectPath = '/admin/dashboard';
          } else if (userRole === 'ROLE_STUDENT' || userRole === 'student') {
            redirectPath = '/student/dashboard';
          }
          
          console.log(`AppInitializer: Redirecting user with role '${userRole}' to: ${redirectPath}`);
          
          // Use window.location.replace for direct navigation
          window.location.replace(redirectPath);
        }
      }
      
      console.log('AppInitializer: App initialization complete');
      
    } catch (error) {
      console.error('App initialization error:', error);
      console.warn('AppInitializer: Continuing despite initialization error');
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
