'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'ROLE_ADMIN':
          router.replace('/admin/dashboard');
          break;
        case 'ROLE_STUDENT':
          router.replace('/student/dashboard');
          break;
        case 'ROLE_STAFF':
          router.replace('/staff/dashboard');
          break;
        default:
          // If no role, redirect to public page
          router.replace('/');
          break;
      }
    } else if (!isLoading && !user) {
      // If not authenticated, redirect to login
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth or redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
