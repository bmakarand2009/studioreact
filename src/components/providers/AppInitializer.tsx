'use client';

import { useEffect, useRef, useState } from 'react';
import { appLoadService } from '@/app/core/app-load';
import { authService } from '@/services/authService';

export function AppInitializer() {
  console.log('AppInitializer: Component rendered');
  
  // Use ref to prevent multiple initializations
  const hasInitializedRef = useRef(false);
  
  // State to track if we're processing an auth token
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [authStep, setAuthStep] = useState<'validating'>('validating');
  
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      console.log('AppInitializer: Already initialized, skipping');
      return;
    }
    
    hasInitializedRef.current = true;
    console.log('AppInitializer: useEffect triggered');
    
    // Set a timeout to prevent the loading state from getting stuck
    const timeoutId = setTimeout(() => {
      if (isProcessingAuth) {
        console.warn('AppInitializer: Auth processing timeout, clearing loading state');
        setIsProcessingAuth(false);
        setAuthStep('validating');
      }
    }, 30000); // 30 seconds timeout
    
    const initializeApp = async () => {
      try {
        console.log('AppInitializer: Starting app initialization...');
        
        // Initialize app configuration (tenant details)
        await appLoadService.initAppConfig();
        
        // Small delay to ensure URL is fully updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // First, check for auth token in URL (highest priority)
        console.log('Checking for auth token in URL...');
        
        // Check if there's an auth token before processing
        if (authService.hasAuthTokenInUrl()) {
          console.log('Auth token detected in URL, showing loading state...');
          setIsProcessingAuth(true);
          setAuthStep('validating');
        }
        
        const authTokenSuccess = await authService.checkAuthTokenInUrl();
        
        if (authTokenSuccess) {
          // Auth token was found and validated, user is now authenticated
          console.log('Authentication successful via URL auth token');
          
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
            
            console.log(`Redirecting user with role '${userRole}' to: ${redirectPath}`);
            
            // Use window.location.replace for direct navigation (no page reload)
            window.location.replace(redirectPath);
          }
          
          setIsProcessingAuth(false);
          // The useAuth hook will handle the rest of the flow
          return;
        } else if (authService.hasAuthTokenInUrl()) {
          // Auth token was found but validation failed
          console.log('Auth token validation failed');
          setIsProcessingAuth(false);
          
          // Show error message briefly
          setTimeout(() => {
            alert('Authentication failed. Please check your token and try again.');
          }, 100);
        }
        
        // If no auth token, check for OAuth callbacks
        console.log('No auth token found, checking for OAuth callbacks...');
        const oauthSuccess = await authService.checkOAuthCallback();
        
        if (oauthSuccess) {
          console.log('OAuth callback detected and processed');
          // The user is now authenticated, redirect will be handled by useAuth hook
        }
      } catch (error) {
        console.error('App initialization error:', error);
        setIsProcessingAuth(false);
        // Silent fail - app can continue without tenant details
      }
    };

    initializeApp();
    
    // Also listen for URL changes (in case OAuth callback or auth token happens after mount)
    const handleUrlChange = async () => {
      console.log('AppInitializer: URL change detected');
      
      // Check if there's an auth token
      if (authService.hasAuthTokenInUrl()) {
        console.log('Auth token detected on URL change, showing loading state...');
        setIsProcessingAuth(true);
        setAuthStep('validating');
      }
      
      // Check for auth token first
      const authTokenSuccess = await authService.checkAuthTokenInUrl();
      if (authTokenSuccess) {
        console.log('Auth token detected on URL change, authentication successful');
        
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
          
          console.log(`Redirecting user with role '${userRole}' to: ${redirectPath}`);
          
          // Use window.location.replace for direct navigation (no page reload)
          window.location.replace(redirectPath);
        }
        
        setIsProcessingAuth(false);
        return;
      } else if (authService.hasAuthTokenInUrl()) {
        // Auth token was found but validation failed
        console.log('Auth token validation failed on URL change');
        setIsProcessingAuth(false);
      }
      
      // Then check for OAuth callback
      authService.checkOAuthCallback().then(success => {
        if (success) {
          console.log('OAuth callback detected on URL change');
          // OAuth callback detected on URL change
        }
      });
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    // Listen for hashchange
    window.addEventListener('hashchange', handleUrlChange);
    
    // Cleanup
    return () => {
      console.log('AppInitializer: Cleanup - removing event listeners and timeout');
      clearTimeout(timeoutId);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Show loading state while processing auth token
  if (isProcessingAuth) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Validating credentials...
          </p>
        </div>
      </div>
    );
  }

  // This component doesn't render anything when not processing auth
  return null;
}
