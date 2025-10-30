

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui';
import { 
  Home, 
  Users, 
  BookOpen, 
  BarChart3,
  UserCircle,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  Calendar,
  ShoppingCart,
  ClipboardCheck
} from 'lucide-react';

interface NavigationItem {
  id: string;
  title: string;
  type: string;
  icon?: string;
  url: string;
}

interface VerticalNavigationProps {
  navigation: NavigationItem[];
  user: any;
  onLogout: () => void;
  onClose?: () => void;
  collapsed?: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  users: Users,
  book: BookOpen,
  'bar-chart': BarChart3,
  calendar: Calendar,
  'shopping-cart': ShoppingCart,
  'clipboard-check': ClipboardCheck,
};

export default function VerticalNavigation({ navigation, user, onLogout, onClose, collapsed = false }: VerticalNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent className="h-5 w-5" />;
    }
    // Fallback icon if the requested icon is not found
    return <Home className="h-5 w-5" />;
  };

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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg">
      {/* Header */}
      <div className={`flex items-center h-16 px-4 transition-all ${collapsed ? 'justify-center' : 'justify-center'}`}>
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-deep-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">W</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Wajooba</span>
          </div>
        ) : (
          <div className="w-10 h-10 bg-deep-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">W</span>
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <UserCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.fullName || user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {collapsed && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <UserCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            )}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {useMemo(() => navigation.map((item) => {
          const active = isActive(item.url);
          
          return (
            <div key={item.id}>
              <Link
                to={item.url}
                className={`group flex items-center py-3 text-sm font-medium rounded-md transition-colors ${
                  collapsed ? 'px-0 justify-center' : 'px-2'
                } ${
                  active
                    ? 'bg-primary-600 text-white shadow-md border-l-4 border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
                title={collapsed ? item.title : undefined}
              >
                {item.icon && (
                  <span className={`${collapsed ? '' : 'mr-3'} flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {getIcon(item.icon)}
                  </span>
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {active && (
                      <div className="w-2 h-2 bg-white rounded-full ml-2"></div>
                    )}
                  </>
                )}
              </Link>
            </div>
          );
        }), [navigation, pathname, collapsed])}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors ${
            collapsed ? 'justify-center' : 'justify-center'
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <img
              className="h-8 mx-auto opacity-50"
              src="/logo-text-on-dark.svg"
              alt="Wajooba"
            />
          </div>
        </div>
      )}
    </div>
  );
}
