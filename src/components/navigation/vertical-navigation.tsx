

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui';
import { appLoadService } from '@/app/core/app-load';
import { ImageUtils } from '@/utils/imageUtils';
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
  ClipboardCheck,
  Pin
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
  onTogglePin?: () => void;
  sidebarPinned?: boolean;
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

export default function VerticalNavigation({ navigation, user, onLogout, onClose, collapsed = false, onTogglePin, sidebarPinned = false }: VerticalNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const tenantDetails = appLoadService.tenantDetails;

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
      <div className={`flex items-center h-16 px-4 transition-all ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {/* When collapsed: Show Pin Button */}
        {collapsed && onTogglePin && (
          <button
            onClick={onTogglePin}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
              sidebarPinned
                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            <Pin className={`h-4 w-4 transition-transform ${sidebarPinned ? 'rotate-0' : 'rotate-45'}`} />
          </button>
        )}
        
        {/* When expanded: Show Logo and Pin Button */}
        {!collapsed && (
          <>
            {/* Wajooba Logo - Left */}
            <img 
              src="https://marksampletest.wajooba.me/assets/images/logos/Wajooba_Logo_w.png"
              alt="Wajooba Logo" 
              className="h-8 w-auto flex-shrink-0"
              style={{
                maxHeight: '32px',
                maxWidth: 'auto'
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
            {/* Pin Button - Right */}
            {onTogglePin && (
              <button
                onClick={onTogglePin}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                  sidebarPinned
                    ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                <Pin className={`h-4 w-4 transition-transform ${sidebarPinned ? 'rotate-0' : 'rotate-45'}`} />
              </button>
            )}
          </>
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
    </div>
  );
}
