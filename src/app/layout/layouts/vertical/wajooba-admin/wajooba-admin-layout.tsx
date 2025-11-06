

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import VerticalNavigation from '@/components/navigation/vertical-navigation';
import Header from '@/components/layout/header';

import { Button } from '@/components/ui';
import { MenuIcon, XIcon, PinIcon, Pin } from 'lucide-react';

interface WajoobaAdminLayoutProps {
  children: ReactNode;
}

export default function WajoobaAdminLayout({ children }: WajoobaAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
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

  const togglePin = () => {
    setSidebarPinned(!sidebarPinned);
    if (sidebarPinned) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  };

  // Auto-collapse logic
  useEffect(() => {
    if (!sidebarPinned && !isHovering && !isScreenSmall) {
      setSidebarCollapsed(true);
    } else if (!sidebarPinned && isHovering && !isScreenSmall) {
      setSidebarCollapsed(false);
    } else if (sidebarPinned && !isScreenSmall) {
      setSidebarCollapsed(false);
    }
  }, [sidebarPinned, isHovering, isScreenSmall]);

  // Don't show loading state here - let the role guard handle it
  // The role guard will show appropriate loading messages
  if (!user) {
    return null; // Don't render anything if no user
  }

  // Use admin navigation
  const currentNavigation = memoizedNavigation.adminNavigation;

  // Use actual admin user
  const displayUser = user;

  const showExpanded = isScreenSmall ? sidebarOpen : (!sidebarCollapsed || isHovering);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        onMouseEnter={() => !isScreenSmall && setIsHovering(true)}
        onMouseLeave={() => !isScreenSmall && setIsHovering(false)}
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
          isScreenSmall
            ? `w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : showExpanded
            ? 'w-64 lg:relative'
            : 'w-20 lg:relative'
        }`}
      >
        {/* Pin Button - Desktop Only */}
        {!isScreenSmall && (
          <button
            onClick={togglePin}
            className={`absolute top-4 right-4 z-10 p-2 rounded-lg transition-all ${
              sidebarPinned
                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            <Pin className={`w-4 h-4 transition-transform ${sidebarPinned ? 'rotate-0' : 'rotate-45'}`} />
          </button>
        )}

        <VerticalNavigation
          navigation={currentNavigation}
          user={displayUser}
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
          collapsed={!showExpanded}
        />
      </div>

      {/* Overlay */}
      {sidebarOpen && isScreenSmall && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
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
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
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
