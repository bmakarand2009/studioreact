

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { 
  MenuIcon, 
  BellIcon, 
  SearchIcon, 
  ArrowLeft,
  SunIcon,
  MoonIcon,
  Pin,
  X,
  Presentation,
  Globe,
  User,
  Sparkles
} from 'lucide-react';
import { usePreview } from '@/contexts/PreviewContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { contactService } from '@/services/contactService';
import { useUIStore } from '@/stores/uiStore';
import { appLoadService } from '@/app/core/app-load';
import { ImageUtils } from '@/utils/imageUtils';
import { useAISidebar } from '@/hooks/useAISidebar';
import { ContactDialog } from '@/components/contact-dialog';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const previewMenuRef = useRef<HTMLDivElement>(null);
  const openAISidebar = useAISidebar();

  const handleBackToAdmin = () => {
    // Get admin token from PreviewContext first, fallback to localStorage
    let adminToken: string | undefined = exitPreviewMode();
    if (!adminToken) {
      const storedToken = contactService.getAdminAuthTokenForPreview();
      adminToken = storedToken ?? undefined;
    }
    
    if (adminToken) {
      authService.accessToken = adminToken;
      contactService.clearAdminToken();
      navigate('/admin/dashboard');
    } else {
      // If no admin token found, just navigate back
      navigate('/admin/dashboard');
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery);
      // You can navigate to a search results page or trigger search here
    }
  };

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      // Small delay to ensure animation starts before focus
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Close search when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        isSearchOpen
      ) {
        handleSearchClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchOpen) {
        handleSearchClose();
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isSearchOpen]);

  // Close preview menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        previewMenuRef.current &&
        !previewMenuRef.current.contains(event.target as Node) &&
        showPreviewMenu
      ) {
        setShowPreviewMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPreviewMenu) {
        setShowPreviewMenu(false);
      }
    };

    if (showPreviewMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showPreviewMenu]);

  const handlePreviewPublic = () => {
    setShowPreviewMenu(false);
    navigate('/');
  };

  const handlePreviewStudent = () => {
    setShowPreviewMenu(false);
    setShowContactDialog(true);
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
        <div className="flex items-center space-x-2 flex-1 justify-end">
          {/* Search Container */}
          <div ref={searchContainerRef} className="relative flex items-center justify-end flex-1">
            {isSearchOpen ? (
              <form 
                onSubmit={handleSearchSubmit}
                className="flex items-center animate-slide-in-right origin-right overflow-hidden w-full max-w-full ml-4"
              >
                <div className="relative flex items-center w-full">
                  <SearchIcon className="absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 w-full h-9 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSearchClose}
                    className="absolute right-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors z-10"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4 text-gray-400 dark:text-gray-400" />
                  </button>
                </div>
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSearchClick}
                className="flex shrink-0"
                aria-label="Open search"
              >
                <SearchIcon className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <BellIcon className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
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

          {/* AI Assistant Button - Only show on screens smaller than 15 inches (xl breakpoint) */}
          {!isInPreviewMode && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => openAISidebar()}
              className="flex xl:hidden items-center gap-2"
              aria-label="AI Assistant"
              title="Get AI suggestions"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden lg:inline">AI</span>
            </Button>
          )}

          {/* Preview Button */}
          {!isInPreviewMode && (
            <div ref={previewMenuRef} className="relative">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setShowPreviewMenu(!showPreviewMenu)}
                className="hidden md:flex items-center gap-2"
                aria-label="Preview site"
                title="Preview site"
              >
                <Presentation className="h-4 w-4" />
                <span>Preview</span>
              </Button>
              
              {/* Mobile Preview Button */}
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setShowPreviewMenu(!showPreviewMenu)}
                className="md:hidden"
                aria-label="Preview site"
                title="Preview site"
              >
                <Presentation className="h-4 w-4" />
              </Button>
              
              {/* Preview Menu */}
              {showPreviewMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px]">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={handlePreviewPublic}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors border-t border-gray-200 dark:border-gray-700"
                    onClick={handlePreviewStudent}
                  >
                    <User className="h-4 w-4" />
                    <span>Student</span>
                  </button>
                </div>
              )}
            </div>
          )}

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

      {/* Contact Dialog for Student Preview */}
      <ContactDialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
      />
    </header>
  );
}
