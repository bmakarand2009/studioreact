

import { ReactNode, useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import VerticalNavigation from '@/components/navigation/vertical-navigation';
import Header from '@/components/layout/header';
import LoadingBar from '@/components/ui/loading-bar';

interface ClassicLayoutProps {
  children: ReactNode;
}

export default function ClassicLayout({ children }: ClassicLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isScreenSmall = useMediaQuery('(max-width: 768px)');
  const { navigation } = useNavigation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!isScreenSmall) {
      setSidebarOpen(false);
    }
  }, [isScreenSmall]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Loading Bar */}
      <LoadingBar />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <VerticalNavigation
          navigation={navigation.adminNavigation}
          user={user}
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
          user={user}
          navigation={navigation}
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
