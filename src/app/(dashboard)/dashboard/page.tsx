'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    // If user is authenticated and on generic dashboard, redirect to role-specific dashboard
    if (!isLoading && isAuthenticated && user) {
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
          // Stay on generic dashboard for unknown roles
          break;
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If user should be redirected to role-specific dashboard, show loading
  if (user && ['ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_STAFF'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-deep-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">W</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Wajooba Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome to your learning platform
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Welcome to Wajooba
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your learning management platform dashboard.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Access your courses, assignments, and more.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              View your recent learning activities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
