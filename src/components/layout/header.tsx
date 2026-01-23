

import { Button } from '@/components/ui';
import { 
  MenuIcon, 
  BellIcon, 
  SearchIcon, 
  GlobeIcon,
  MaximizeIcon,
  ArrowLeft,
  SunIcon,
  MoonIcon,
  Pin
} from 'lucide-react';
import { usePreview } from '@/contexts/PreviewContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useUIStore } from '@/stores/uiStore';
import { appLoadService } from '@/app/core/app-load';
import { ImageUtils } from '@/utils/imageUtils';

interface HeaderProps {
  onMenuClick: () => void;
  onTogglePin: () => void;
  sidebarPinned: boolean;
  user: any;
  navigation: any;
}

export default function Header({ onMenuClick, onTogglePin, sidebarPinned, user, navigation }: HeaderProps) {
  const { isInPreviewMode, exitPreviewMode } = usePreview();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUIStore();
  const tenantDetails = appLoadService.tenantDetails;

  const handleBackToAdmin = () => {
    const adminToken = exitPreviewMode();
    if (adminToken) {
      authService.accessToken = adminToken;
      navigate('/admin/dashboard');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and breadcrumbs */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          {/* Admin View (Mobile) */}
          {isInPreviewMode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToAdmin}
              className="lg:hidden border-blue-500 text-blue-600 hover:bg-blue-50 bg-blue-100 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin View
            </Button>
          )}
          
          {/* Breadcrumbs can be added here */}
          <div className="hidden md:block">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li className="flex items-center gap-2">
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
                      className="h-8 w-auto"
                      style={{
                        maxHeight: tenantDetails.org.logoHeight ? `${tenantDetails.org.logoHeight}px` : '32px',
                        maxWidth: tenantDetails.org.logoWidth ? `${tenantDetails.org.logoWidth}px` : 'auto'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'logo-fallback h-8 w-8 rounded-lg bg-primary flex items-center justify-center';
                          fallback.innerHTML = `<span class="text-white text-sm font-bold">${(tenantDetails?.name?.charAt(0) || tenantDetails?.org?.title?.charAt(0) || 'W').toUpperCase()}</span>`;
                          parent.insertBefore(fallback, target);
                        }
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {tenantDetails?.name?.charAt(0).toUpperCase() || tenantDetails?.org?.title?.charAt(0).toUpperCase() || 'W'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-bold text-black dark:text-white">
                    {tenantDetails?.name || tenantDetails?.org?.title || 'Wajooba'}
                  </span>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <SearchIcon className="h-4 w-4" />
          </Button>

          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="relative"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <BellIcon className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* Language */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <GlobeIcon className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <MaximizeIcon className="h-4 w-4" />
          </Button>

          {/* Admin View (Preview Mode) */}
          {isInPreviewMode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToAdmin}
              className="hidden md:flex border-blue-500 text-blue-600 hover:bg-blue-50 bg-blue-100 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin View
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
