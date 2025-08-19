'use client';

import { useEffect } from 'react';
import { appLoadService } from '@/app/core/app-load';
import { authService } from '@/services/authService';

export function AppInitializer() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize app configuration (tenant details)
        await appLoadService.initAppConfig();
        
        // Small delay to ensure URL is fully updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check for OAuth callbacks and handle them
        const oauthSuccess = await authService.checkOAuthCallback();
        
        if (oauthSuccess) {
          // The user is now authenticated, redirect will be handled by useAuth hook
        }
      } catch (error) {
        // Silent fail - app can continue without tenant details
      }
    };

    initializeApp();
    
    // Also listen for URL changes (in case OAuth callback happens after mount)
    const handleUrlChange = () => {
      authService.checkOAuthCallback().then(success => {
        if (success) {
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
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
