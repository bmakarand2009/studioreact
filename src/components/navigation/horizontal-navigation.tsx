

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

interface NavigationItem {
  id: string;
  title: string;
  type: string;
  icon?: string;
  url: string;
  isExternalLink?: boolean;
  externalLink?: string | null;
}

interface HorizontalNavigationProps {
  navigation: NavigationItem[];
  user: any;
  mobile?: boolean;
  onItemClick?: () => void;
  /** Use light text (for dark header background e.g. public layout) */
  variant?: 'default' | 'light';
}

export default function HorizontalNavigation({ 
  navigation, 
  user, 
  mobile = false, 
  onItemClick,
  variant = 'default',
}: HorizontalNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (url: string) => {
    // Skip active check for external links
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return false;
    }
    
    // Exact match first
    if (pathname === url) {
      return true;
    }
    
    // For dashboard routes, only match exact dashboard path, not all routes starting with /admin/ or /student/
    if (url === '/admin/dashboard' && pathname === '/admin/dashboard') {
      return true;
    }
    
    if (url === '/student/dashboard' && pathname === '/student/dashboard') {
      return true;
    }
    
    if (url === '/staff/dashboard' && pathname === '/staff/dashboard') {
      return true;
    }
    
    // For other routes, check if pathname starts with the URL (but not dashboard)
    if (url !== '/' && !url.includes('dashboard') && pathname.startsWith(url)) {
      return true;
    }
    
    // For root path, only match exact
    if (url === '/' && pathname === '/') {
      return true;
    }
    
    return false;
  };

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  const renderNavItem = (item: NavigationItem, isMobile: boolean) => {
    const baseClasses = isMobile
      ? 'block px-3 py-2 rounded-md text-base font-medium transition-colors'
      : 'px-3 py-2 rounded-md text-sm font-medium transition-colors';
    
    const activeClasses = variant === 'light'
      ? (isActive(item.url)
          ? 'bg-white/20 text-white shadow-md'
          : 'text-white/90 hover:bg-white/15 hover:text-white')
      : (isActive(item.url)
          ? 'bg-primary-500 text-white shadow-md'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white');

    const className = `${baseClasses} ${activeClasses}`;

    // Handle external links
    if (item.isExternalLink && item.externalLink) {
      return (
        <a
          key={item.id}
          href={item.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleItemClick}
          className={className}
        >
          {item.title}
        </a>
      );
    }

    // Handle internal links
    return (
      <Link
        key={item.id}
        to={item.url}
        onClick={handleItemClick}
        className={className}
      >
        {item.title}
      </Link>
    );
  };

  if (mobile) {
    return (
      <div className="space-y-1">
        {useMemo(() => navigation.map((item) => renderNavItem(item, true)), [navigation, pathname, handleItemClick])}
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-2">
      {useMemo(() => navigation.map((item) => renderNavItem(item, false)), [navigation, pathname, handleItemClick])}
    </nav>
  );
}
