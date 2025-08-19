'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/authService';

interface User {
  id: string;
  email: string;
  role: string;
  fullName: string;
  [key: string]: any;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => Promise<boolean>;
  hasPermission: (permission: string | string[]) => Promise<boolean>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Initialize auth state from localStorage first
        authService.initializeAuthState();
        
        const authenticated = await authService.check();
        
        if (authenticated) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('useAuth: User authenticated:', currentUser);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log('useAuth: User not authenticated');
          
          // Only redirect if not on a public route
          const publicRoutes = ['/login', '/forgot-password', '/sign-up', '/'];
          if (!publicRoutes.includes(pathname)) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('useAuth: Error checking auth:', error);
        setUser(null);
        setIsAuthenticated(false);
        
        // Only redirect if not on a public route
        const publicRoutes = ['/login', '/forgot-password', '/sign-up', '/'];
        if (!publicRoutes.includes(pathname)) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Remove pathname and router from dependencies to prevent infinite loops

  const hasRole = async (role: string | string[]): Promise<boolean> => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  const hasPermission = async (permission: string | string[]): Promise<boolean> => {
    if (!user) return false;
    
    // This would check user permissions from the backend
    // For now, we'll use role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'ROLE_ADMIN': ['read', 'write', 'delete', 'manage_users', 'manage_system'],
      'ROLE_STAFF': ['read', 'write', 'manage_courses'],
      'ROLE_STUDENT': ['read', 'enroll_courses'],
    };

    const userPermissions = rolePermissions[user.role] || [];
    
    if (Array.isArray(permission)) {
      return permission.some(p => userPermissions.includes(p));
    }
    
    return userPermissions.includes(permission);
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasPermission,
    logout,
  };
}
