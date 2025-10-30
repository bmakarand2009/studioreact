'use client';

import { useEffect, useRef, useState } from 'react';
import { appLoadService } from '@/app/core/app-load';
import { authService } from '@/services/authService';

export function AppInitializer() {
  // Use ref to prevent multiple initializations
  const hasInitializedRef = useRef(false);
  
  // State to track app initialization
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
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
        // Don't block the app, just continue
        setIsInitializing(false);
        return;
      }
      
      console.log('AppInitializer: Successfully initialized with tenant details');
      
      // Now that app is initialized, check for auth tokens
      console.log('AppInitializer: Checking for auth tokens...');
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
          
          // Use window.location.replace for direct navigation (no page reload)
          window.location.replace(redirectPath);
          return; // Don't set isInitializing to false since we're redirecting
        }
      }
      
      // App initialization complete
      console.log('AppInitializer: App initialization complete');
      setIsInitializing(false);
      
    } catch (error) {
      console.error('App initialization error:', error);
      // Don't block the app with an error screen, just log and continue
      console.warn('AppInitializer: Continuing despite initialization error');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    initializeApp();
    
    // Cleanup
    return () => {
      console.log('AppInitializer: Cleanup');
    };
  }, []);

  // Show connection error if initialization failed
  if (connectionError) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Connection Error
          </h1>
          
          {/* Error Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {connectionError}
          </p>
          
          {/* Retry Button */}
          <button
            onClick={() => {
              setConnectionError(null);
              setIsInitializing(true);
              hasInitializedRef.current = false;
              initializeApp();
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
          
          {/* Additional Info */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            If the problem persists, please contact support
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while initializing app
  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          
          {/* Animated Loading Dots */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // This component doesn't render nothing when initialization is complete
  return null;
}
