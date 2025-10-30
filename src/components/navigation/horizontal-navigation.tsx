'use client';

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

interface NavigationItem {
  id: string;
  title: string;
  type: string;
  icon?: string;
  url: string;
}

interface HorizontalNavigationProps {
  navigation: NavigationItem[];
  user: any;
  mobile?: boolean;
  onItemClick?: () => void;
}

export default function HorizontalNavigation({ 
  navigation, 
  user, 
  mobile = false, 
  onItemClick 
}: HorizontalNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (url: string) => {
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

  if (mobile) {
    return (
      <div className="space-y-1">
        {useMemo(() => navigation.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            onClick={handleItemClick}
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive(item.url)
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {item.title}
          </Link>
        )), [navigation, pathname, handleItemClick])}
      </div>
    );
  }

  return (
    <nav className="flex space-x-8">
      {useMemo(() => navigation.map((item) => (
        <Link
          key={item.id}
          href={item.url}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive(item.url)
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {item.title}
        </Link>
      )), [navigation, pathname])}
    </nav>
  );
}
