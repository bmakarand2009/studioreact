

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
                  <button
                    onClick={onTogglePin}
                    className={`hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      sidebarPinned
                        ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                    title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                  >
                    <Pin className={`h-4 w-4 transition-transform ${sidebarPinned ? 'rotate-0' : 'rotate-45'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Dashboard
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
