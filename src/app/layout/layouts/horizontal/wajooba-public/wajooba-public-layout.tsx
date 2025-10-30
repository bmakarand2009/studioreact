import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import HorizontalNavigation from '@/components/navigation/horizontal-navigation';

import { Button } from '@/components/ui';
import { MenuIcon, XIcon } from 'lucide-react';

interface WajoobaPublicLayoutProps {
  children: ReactNode;
}

export default function WajoobaPublicLayout({ children }: WajoobaPublicLayoutProps) {
  console.log('WajoobaPublicLayout: Rendering start');
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScreenSmall = useMediaQuery('(max-width: 768px)');
  const { navigation } = useNavigation();
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('WajoobaPublicLayout: State loaded', { 
    hasUser: !!user, 
    hasNavigation: !!navigation,
    hasChildren: !!children 
  });

  // Close mobile menu on screen size change
  useEffect(() => {
    if (!isScreenSmall) {
      setMobileMenuOpen(false);
    }
  }, [isScreenSmall]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  console.log('WajoobaPublicLayout: Rendering JSX');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header with Public Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">W</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Wajooba
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <HorizontalNavigation
                navigation={navigation.publicNavigation}
                user={user}
              />
            </div>

            {/* CTA Buttons & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* CTA Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                {user ? (
                  <Button variant="primary" size="sm" onClick={() => {
                    switch (user.role) {
                      case 'ROLE_ADMIN':
                        navigate('/admin/dashboard');
                        break;
                      case 'ROLE_STUDENT':
                        navigate('/student/dashboard');
                        break;
                      case 'ROLE_STAFF':
                        navigate('/staff/dashboard');
                        break;
                      default:
                        navigate('/dashboard');
                        break;
                    }
                  }}>
                    Dashboard
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                )}
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
                navigation={navigation.publicNavigation}
                user={user}
                mobile
                onItemClick={() => setMobileMenuOpen(false)}
              />
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {user ? (
                    <Button variant="primary" size="sm" fullWidth onClick={() => {
                      switch (user.role) {
                        case 'ROLE_ADMIN':
                          navigate('/admin/dashboard');
                          break;
                        case 'ROLE_STUDENT':
                          navigate('/student/dashboard');
                          break;
                        case 'ROLE_STAFF':
                          navigate('/staff/dashboard');
                          break;
                        default:
                          navigate('/dashboard');
                          break;
                      }
                    }}>
                      Dashboard
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/login')}>
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white text-lg font-bold">W</span>
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Wajooba
                </span>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-md">
                Empowering education through innovative technology solutions. 
                Join thousands of students and educators using Wajooba.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
                Solutions
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    For Students
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    For Educators
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    For Institutions
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
                Support
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-base text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Wajooba. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
