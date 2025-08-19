'use client';

import { Button } from '@/components/ui';
import { 
  MenuIcon, 
  BellIcon, 
  SearchIcon, 
  GlobeIcon,
  MaximizeIcon,
  ArrowLeft
} from 'lucide-react';
import { usePreview } from '@/contexts/PreviewContext';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

interface HeaderProps {
  onMenuClick: () => void;
  user: any;
  navigation: any;
}

export default function Header({ onMenuClick, user, navigation }: HeaderProps) {
  const { isInPreviewMode, exitPreviewMode } = usePreview();
  const router = useRouter();

  const handleBackToAdmin = () => {
    const adminToken = exitPreviewMode();
    if (adminToken) {
      authService.accessToken = adminToken;
      router.push('/admin/dashboard');
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
                <li>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
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
