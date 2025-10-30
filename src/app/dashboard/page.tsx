'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'ROLE_ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'ROLE_STUDENT':
          navigate('/student/dashboard', { replace: true });
          break;
        case 'ROLE_STAFF':
          navigate('/staff/dashboard', { replace: true });
          break;
        default:
          // If no role, redirect to public page
          navigate('/', { replace: true });
          break;
      }
    } else if (!isLoading && !user) {
      // If not authenticated, redirect to login
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

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
