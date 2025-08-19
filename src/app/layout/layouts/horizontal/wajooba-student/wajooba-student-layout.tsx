'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import HorizontalNavigation from '@/components/navigation/horizontal-navigation';
import Header from '@/components/layout/header';
import LoadingBar from '@/components/ui/loading-bar';
import { Button } from '@/components/ui';
import { MenuIcon, XIcon } from 'lucide-react';

interface WajoobaStudentLayoutProps {
  children: ReactNode;
}

export default function WajoobaStudentLayout({ children }: WajoobaStudentLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScreenSmall = useMediaQuery('(max-width: 768px)');
  const { navigation } = useNavigation();
  const { user, logout } = useAuth();

  // Close mobile menu on screen size change
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

      {/* Header with Horizontal Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">W</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Wajooba Student
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <HorizontalNavigation
                navigation={navigation.studentNavigation}
                user={user}
              />
            </div>

            {/* Logout Button & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Logout Button */}
              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Logout
                </Button>
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
                navigation={navigation.studentNavigation}
                user={user}
                mobile
                onItemClick={() => setMobileMenuOpen(false)}
              />
              {/* Mobile Logout */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Logout
                </Button>
              </div>
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
            © {new Date().getFullYear()} Wajooba Student Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
