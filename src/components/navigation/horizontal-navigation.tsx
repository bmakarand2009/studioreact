'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + '/');
  };

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  if (mobile) {
    return (
      <div className="space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            onClick={handleItemClick}
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive(item.url)
                ? 'bg-primary text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {item.title}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className="flex space-x-8">
      {navigation.map((item) => (
        <Link
          key={item.id}
          href={item.url}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive(item.url)
              ? 'bg-primary text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
