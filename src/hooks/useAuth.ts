'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userService } from '@/app/core/user';
import { authService } from '@/services/authService';
import { useUserContext } from '@/contexts/UserContext';
import type { UserProfile } from '@/app/core/user';

export interface UseAuthReturn {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Global flag to prevent multiple auth checks from running simultaneously
let globalAuthCheckRunning = false;

export function useAuth(): UseAuthReturn {
  const { state, setUser, setLoading, setAuthenticated, logout: contextLogout } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  
  // Use ref to track if auth check has already run
  const hasRunRef = useRef(false);
  // Use ref to track if we're currently processing
  const isProcessingRef = useRef(false);

  const checkAuth = useCallback(async () => {
    // Prevent multiple executions globally
    if (globalAuthCheckRunning || hasRunRef.current || isProcessingRef.current) {
      console.log('useAuth: Auth check already running globally or locally, skipping');
      return;
    }

    // Don't run auth check if already loading
    if (state.isLoading) {
      console.log('useAuth: Skipping auth check - already loading');
      return;
    }

    // If we already have a user, don't check again
    if (state.user && !state.isLoading) {
      console.log('useAuth: User already exists, skipping auth check');
      hasRunRef.current = true; // Mark as run to prevent future executions
      return;
    }

    try {
      // Set flags first
      globalAuthCheckRunning = true;
      hasRunRef.current = true;
      isProcessingRef.current = true;

      // Only show loading if we actually have a token to validate
      const hasToken = authService.isLoggedIn() || authService.hasAuthTokenInUrl();
      if (hasToken) {
          setLoading(true);
      }

      console.log('useAuth: Starting auth check...');

      // Set a timeout to reset the global flag if something goes wrong
      const timeoutId = setTimeout(() => {
        if (globalAuthCheckRunning) {
          console.warn('useAuth: Global auth check timeout, resetting flag');
          globalAuthCheckRunning = false;
        }
      }, 10000); // 10 seconds timeout

      // Check if user is already authenticated in the service
      if (authService.isLoggedIn()) {
        console.log('useAuth: User is logged in, fetching current user...');
        // Try to get user from auth service
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          console.log('useAuth: Current user found:', currentUser.email || currentUser.name);
          clearTimeout(timeoutId);
          setUser(currentUser as UserProfile);
          return;
        }
      }

      // Try to authenticate using the auth service
      // If we don't have a token, skip heavy check to avoid flicker
      if (!hasToken) {
          // No token → not authenticated
          setUser(null);
          const publicRoutes = ['/login', '/forgot-password', '/sign-up', '/'];
          if (!publicRoutes.includes(pathname)) {
              const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
              navigate(redirectUrl);
          }
          return;
      }

      // We have a token, perform the check
      const authenticated = await authService.check();

      if (authenticated) {
        console.log('useAuth: Authentication successful, fetching user...');
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          console.log('useAuth: Setting user in context:', currentUser.email || currentUser.name);
          setUser(currentUser as UserProfile);
        }
      } else {
        console.log('useAuth: Not authenticated');
        setUser(null);
        
        // Only redirect if we're not already on a public route
        const publicRoutes = ['/login', '/forgot-password', '/sign-up', '/'];
        if (!publicRoutes.includes(pathname)) {
          console.log('useAuth: Redirecting to login from:', pathname);
          // Redirect to login with current page as redirect parameter
          const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
          navigate(redirectUrl);
        } else {
          console.log('useAuth: Already on public route:', pathname);
        }
      }
      
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('useAuth: Auth check error:', error);
      setUser(null);
      
      // Only redirect if we're not already on a public route
      const publicRoutes = ['/login', '/forgot-password', '/sign-up', '/'];
      if (!publicRoutes.includes(pathname)) {
        console.log('useAuth: Error redirecting to login from:', pathname);
        // Redirect to login with current page as redirect parameter
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        navigate(redirectUrl);
      } else {
        console.log('useAuth: Error but already on public route:', pathname);
      }
    } finally {
      console.log('useAuth: Setting loading to false, current state:', state.isLoading);
      setLoading(false);
      isProcessingRef.current = false; // Mark as not processing
      globalAuthCheckRunning = false; // Clear global flag
      
      // Verify the loading state was reset
      setTimeout(() => {
        console.log('useAuth: Loading state after reset:', state.isLoading);
      }, 100);
    }
  }, [pathname, navigate, setUser, setLoading, state.isLoading, state.user]);

  useEffect(() => {
    // Only run auth check once on mount, not on every render
    console.log('useAuth: useEffect triggered - running initial auth check');
    
    // Check if we already have a user or if we're already loading
    if (state.user || state.isLoading || hasRunRef.current) {
      console.log('useAuth: Skipping initial auth check - user exists, already loading, or already run');
      hasRunRef.current = true;
      return;
    }
    
    checkAuth();
    
    // Cleanup function to reset the ref if component unmounts
    return () => {
      hasRunRef.current = false;
      isProcessingRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const hasRole = useCallback((role: string | string[]) => {
    console.log('useAuth: hasRole called with:', { role, currentUser: state.user });
    return userService.hasRole(state.user, role);
  }, [state.user]);

  const hasPermission = useCallback((permission: string) => {
    // For now, return true if user has any role
    // This can be expanded based on actual permission system
    return state.isAuthenticated;
  }, [state.isAuthenticated]);

  const refreshUser = useCallback(async () => {
    console.log('useAuth: Manual refresh requested');
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser as UserProfile);
        console.log('useAuth: User refreshed successfully');
      }
    } catch (error) {
      console.error('useAuth: Refresh error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      contextLogout();
      navigate('/login');
    } catch (error) {
      console.error('useAuth: Logout error:', error);
      // Force logout even if API fails
      contextLogout();
      navigate('/login');
    }
  }, [authService, contextLogout, navigate]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    hasRole,
    hasPermission,
    logout,
    refreshUser,
  };
}
