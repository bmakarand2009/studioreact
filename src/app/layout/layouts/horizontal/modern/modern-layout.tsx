

import { ReactNode, useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useUser } from '@/hooks/useUser';
import HorizontalNavigation from '@/components/navigation/horizontal-navigation';
import LoadingBar from '@/components/ui/loading-bar';
import { Button } from '@/components/ui';
import { MenuIcon, XIcon } from 'lucide-react';

interface ModernLayoutProps {
  children: ReactNode;
}

export default function ModernLayout({ children }: ModernLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScreenSmall = useMediaQuery('(max-width: 768px)');
  const { navigation } = useNavigation();
  const { user } = useUser();

  useEffect(() => {
    if (!isScreenSmall) {
      setMobileMenuOpen(false);
    }
  }, [isScreenSmall]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Loading Bar */}
      <LoadingBar />

      {/* Header with Modern Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center">
                <span className="text-white text-sm font-bold">W</span>
              </div>
              <span className="ml-2 text-xl font-semibold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Wisely
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <HorizontalNavigation
                navigation={navigation.adminNavigation}
                user={user}
              />
            </div>

            {/* User Menu & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <div className="hidden md:block">
                <UserMenu user={user} />
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden"
              >
                {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <HorizontalNavigation
                navigation={navigation.adminNavigation}
                user={user}
                mobile
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Wisely. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// User Menu Component
function UserMenu({ user }: { user: any }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {user?.name || 'User'}
        </span>
      </div>
    </div>
  );
}
