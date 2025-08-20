'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import VerticalNavigation from '@/components/navigation/vertical-navigation';
import Header from '@/components/layout/header';

import { Button } from '@/components/ui';
import { MenuIcon, XIcon } from 'lucide-react';

interface WajoobaAdminLayoutProps {
  children: ReactNode;
}

export default function WajoobaAdminLayout({ children }: WajoobaAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isScreenSmall = useMediaQuery('(max-width: 768px)');
  const { navigation } = useNavigation();
  const { user, logout, isLoading } = useAuth();

  // Memoize navigation to prevent unnecessary re-renders
  const memoizedNavigation = useMemo(() => navigation, [navigation]);

  // Close sidebar on screen size change
  useEffect(() => {
    if (!isScreenSmall) {
      setSidebarOpen(false);
    }
  }, [isScreenSmall]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Don't show loading state here - let the role guard handle it
  // The role guard will show appropriate loading messages
  if (!user) {
    return null; // Don't render anything if no user
  }

  // Use admin navigation
  const currentNavigation = memoizedNavigation.adminNavigation;

  // Use actual admin user
  const displayUser = user;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Loading Bar */}
      



      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <VerticalNavigation
          navigation={currentNavigation}
          user={displayUser}
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={toggleSidebar}
          user={displayUser}
          navigation={memoizedNavigation}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Wajooba. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
