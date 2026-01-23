import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useTenantMenu } from '@/hooks/useTenantMenu';
import { appLoadService } from '@/app/core/app-load';
import { ImageUtils } from '@/utils/imageUtils';
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
  const { footerItems, legalItems } = useTenantMenu();
  const navigate = useNavigate();
  const tenantDetails = appLoadService.tenantDetails;

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

  const handleDashboardClick = () => {
    const normalizedRole = (user?.role || '').toUpperCase();
    switch (normalizedRole) {
      case 'ROLE_ADMIN':
      case 'ADMIN':
      case 'ROLE_STAFF':
      case 'STAFF':
        navigate('/admin/dashboard');
        break;
      case 'ROLE_STUDENT':
      case 'STUDENT':
        navigate('/student/dashboard');
        break;
      default:
        navigate('/dashboard');
        break;
    }
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
              {tenantDetails?.org?.logo ? (
                <img 
                  src={ImageUtils.buildCloudinaryUrl(
                    tenantDetails.cloudName,
                    tenantDetails.org.logo,
                    tenantDetails.org.logoWidth || 200,
                    tenantDetails.org.logoHeight || 60,
                    'fit'
                  )} 
                  alt={tenantDetails.name || tenantDetails.org.title || 'Logo'} 
                  className="h-[50px] w-auto"
                  style={{
                    maxHeight: tenantDetails.org.logoHeight ? `${tenantDetails.org.logoHeight}px` : '50px',
                    maxWidth: tenantDetails.org.logoWidth ? `${tenantDetails.org.logoWidth}px` : 'auto'
                  }}
                  onError={(e) => {
                    // Fallback to letter badge if logo fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'logo-fallback h-[50px] w-[50px] rounded-lg bg-primary flex items-center justify-center';
                      fallback.innerHTML = `<span class="text-white text-sm font-bold">${(tenantDetails?.name?.charAt(0) || tenantDetails?.org?.title?.charAt(0) || 'W').toUpperCase()}</span>`;
                      parent.insertBefore(fallback, target);
                    }
                  }}
                />
              ) : (
                <div className="h-[50px] w-[50px] rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {tenantDetails?.name?.charAt(0).toUpperCase() || tenantDetails?.org?.title?.charAt(0).toUpperCase() || 'W'}
                  </span>
                </div>
              )}
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
                {user ? 
                  <Button variant="primary" size="sm" onClick={handleDashboardClick}>
                    Dashboard
                  </Button>
                :
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                }
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
                  {user ?
                    <Button variant="primary" size="sm" fullWidth onClick={handleDashboardClick}>
                      Dashboard
                    </Button>
                  :
                    <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/login')}>
                      Sign In
                    </Button>
                  }
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
      <footer className="bg-gray-900 dark:bg-gray-950 border-t border-gray-800 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center">
                {tenantDetails?.org?.logo ? (
                  <img 
                    src={ImageUtils.buildCloudinaryUrl(
                      tenantDetails.cloudName,
                      tenantDetails.org.logo,
                      tenantDetails.org.logoWidth || 200,
                      tenantDetails.org.logoHeight || 60,
                      'fit'
                    )} 
                    alt={tenantDetails.name || tenantDetails.org.title || 'Logo'} 
                    className="h-10 w-auto"
                    style={{
                      maxHeight: tenantDetails.org.logoHeight ? `${tenantDetails.org.logoHeight}px` : '40px',
                      maxWidth: tenantDetails.org.logoWidth ? `${tenantDetails.org.logoWidth}px` : 'auto'
                    }}
                    onError={(e) => {
                      // Fallback to letter badge if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.logo-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'logo-fallback h-10 w-10 rounded-lg bg-primary flex items-center justify-center';
                        fallback.innerHTML = `<span class="text-white text-lg font-bold">${(tenantDetails?.name?.charAt(0) || tenantDetails?.org?.title?.charAt(0) || 'W').toUpperCase()}</span>`;
                        parent.insertBefore(fallback, target);
                      }
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {tenantDetails?.name?.charAt(0).toUpperCase() || tenantDetails?.org?.title?.charAt(0).toUpperCase() || 'W'}
                    </span>
                  </div>
                )}
                <span className="ml-3 text-xl font-semibold text-gray-100">
                  {tenantDetails?.name || tenantDetails?.org?.title || 'Wajooba'}
                </span>
              </div>
              {tenantDetails?.org?.footerInfo && (
                <p className="mt-4 text-gray-300 max-w-md">
                  {tenantDetails.org.footerInfo}
                </p>
              )}
            </div>

            {/* Dynamic Footer Links */}
            {footerItems.length > 0 && (() => {
              const nonLegalItems = footerItems.filter(item => !item.isLegal);
              const shouldSplit = nonLegalItems.length > 5;
              const firstColumn = shouldSplit ? nonLegalItems.slice(0, 5) : nonLegalItems;
              const secondColumn = shouldSplit ? nonLegalItems.slice(5) : [];

              return (
                <div>
                  <h3 className="text-sm font-semibold text-gray-100 tracking-wider uppercase">
                    Links
                  </h3>
                  <div className={shouldSplit ? 'mt-4 grid grid-cols-2 gap-x-8 gap-y-4' : 'mt-4'}>
                    <ul className="space-y-4">
                      {firstColumn.map((item) => (
                        <li key={item.id}>
                          {item.isExternalLink && item.externalLink ? (
                            <a
                              href={item.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base text-gray-300 hover:text-gray-100"
                            >
                              {item.title}
                            </a>
                          ) : (
                            <Link
                              to={item.url}
                              className="text-base text-gray-300 hover:text-gray-100"
                            >
                              {item.title}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                    {shouldSplit && secondColumn.length > 0 && (
                      <ul className="space-y-4">
                        {secondColumn.map((item) => (
                          <li key={item.id}>
                            {item.isExternalLink && item.externalLink ? (
                              <a
                                href={item.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base text-gray-300 hover:text-gray-100"
                              >
                                {item.title}
                              </a>
                            ) : (
                              <Link
                                to={item.url}
                                className="text-base text-gray-300 hover:text-gray-100"
                              >
                                {item.title}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Legal Links */}
            {legalItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-100 tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  {legalItems.map((item) => (
                    <li key={item.id}>
                      {item.isExternalLink && item.externalLink ? (
                        <a
                          href={item.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-gray-300 hover:text-gray-100"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <Link
                          to={item.url}
                          className="text-base text-gray-300 hover:text-gray-100"
                        >
                          {item.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 dark:border-gray-800">
            <p className="text-center text-base text-gray-400">
              © {new Date().getFullYear()} {tenantDetails?.name || tenantDetails?.org?.title || 'Wajooba'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
