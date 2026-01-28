

import { ReactNode, useState, useEffect, useMemo, useRef } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import VerticalNavigation from '@/components/navigation/vertical-navigation';
import Header from '@/components/layout/header';

import { MediaSliderPanel } from '@/components/media-slider';
import { AISidebarPanel } from '@/components/ai-sidebar';
import { SidebarPayload } from '@/services/sidebarControllerService';
import { cn } from '@/utils/cn';

interface WajoobaAdminLayoutProps {
  children: ReactNode;
}

export default function WajoobaAdminLayout({ children }: WajoobaAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [mediaSliderOpen, setMediaSliderOpen] = useState(false);
  const [aiSidebarOpen, setAISidebarOpen] = useState(false);
  const isScreenSmall = useMediaQuery('(max-width: 768px)');
  const isLargeScreen = useMediaQuery('(min-width: 1440px)');
  const { navigation } = useNavigation();
  const { user, logout } = useAuth();

  // Memoize navigation to prevent unnecessary re-renders
  const memoizedNavigation = useMemo(() => navigation, [navigation]);

  const previousSidebarStateRef = useRef({
    pinned: sidebarPinned,
    collapsed: sidebarCollapsed,
  });
  const forcedFoldRef = useRef(false);
  const sidebarPinnedRef = useRef(sidebarPinned);
  const sidebarCollapsedRef = useRef(sidebarCollapsed);

  useEffect(() => {
    sidebarPinnedRef.current = sidebarPinned;
  }, [sidebarPinned]);

  useEffect(() => {
    sidebarCollapsedRef.current = sidebarCollapsed;
  }, [sidebarCollapsed]);

  // Close sidebar on screen size change
  useEffect(() => {
    if (!isScreenSmall) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarOpen(false);
    }
  }, [isScreenSmall]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const togglePin = () => {
    setSidebarPinned(!sidebarPinned);
    if (sidebarPinned) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  };

  // Auto-collapse logic
  useEffect(() => {
    if (!sidebarPinned && !isHovering && !isScreenSmall) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarCollapsed(true);
    } else if (!sidebarPinned && isHovering && !isScreenSmall) {
      setSidebarCollapsed(false);
    } else if (sidebarPinned && !isScreenSmall) {
      setSidebarCollapsed(false);
    }
  }, [sidebarPinned, isHovering, isScreenSmall]);

  // Keep AI sidebar open on large screens - only update state, don't dispatch event
  // The sidebar controller will handle the event dispatch when it opens
  useEffect(() => {
    if (isLargeScreen) {
      // On large screens, ensure sidebar state is open for layout purposes
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAISidebarOpen((prev) => {
        if (!prev) {
          return true;
        }
        return prev;
      });
    }
  }, [isLargeScreen]);

  useEffect(() => {
    const handleSidebarLayout = (event: Event) => {
      const detail = (event as CustomEvent<SidebarPayload>).detail;
      if (!detail) {
        return;
      }

      // Handle media slider
      if (detail.name === 'mediaSlider') {
        setMediaSliderOpen(detail.open);
        if (detail.open) {
          previousSidebarStateRef.current = {
            pinned: sidebarPinnedRef.current,
            collapsed: sidebarCollapsedRef.current,
          };
          forcedFoldRef.current = true;
          if (sidebarPinnedRef.current) {
            setSidebarPinned(false);
          }
          setSidebarCollapsed(true);
        } else {
          // Use functional update to check current aiSidebarOpen state
          setAISidebarOpen((currentAIOpen) => {
            if (forcedFoldRef.current && !currentAIOpen && !isLargeScreen) {
              setSidebarPinned(previousSidebarStateRef.current.pinned);
              setSidebarCollapsed(previousSidebarStateRef.current.collapsed);
              forcedFoldRef.current = false;
            }
            return currentAIOpen;
          });
        }
      }

      // Handle AI sidebar
      if (detail.name === 'aiSidebar') {
        // On large screens, always keep sidebar open state
        const shouldBeOpen = isLargeScreen || detail.open;
        
        // Use functional update to avoid dependency on aiSidebarOpen
        setAISidebarOpen((prev) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (shouldBeOpen !== prev) {
            return shouldBeOpen;
          }
          return prev;
        });
        
        if (shouldBeOpen) {
          previousSidebarStateRef.current = {
            pinned: sidebarPinnedRef.current,
            collapsed: sidebarCollapsedRef.current,
          };
          forcedFoldRef.current = true;
          if (sidebarPinnedRef.current) {
            setSidebarPinned(false);
          }
          setSidebarCollapsed(true);
        } else {
          // Use ref to check current state instead of closure value
          setMediaSliderOpen((currentMediaOpen) => {
            if (forcedFoldRef.current && !currentMediaOpen) {
              setSidebarPinned(previousSidebarStateRef.current.pinned);
              setSidebarCollapsed(previousSidebarStateRef.current.collapsed);
              forcedFoldRef.current = false;
            }
            return currentMediaOpen;
          });
        }
      }
    };

    window.addEventListener('sidebar:layout-change', handleSidebarLayout);
    return () => {
      window.removeEventListener('sidebar:layout-change', handleSidebarLayout);
    };
  }, [isLargeScreen]); // Remove aiSidebarOpen and mediaSliderOpen from deps to prevent loops

  // Don't show loading state here - let the role guard handle it
  // The role guard will show appropriate loading messages
  if (!user) {
    return null; // Don't render anything if no user
  }

  // Use admin navigation
  const currentNavigation = memoizedNavigation.adminNavigation;

  // Use actual admin user
  const displayUser = user;

  const showExpanded = isScreenSmall ? sidebarOpen : (!sidebarCollapsed || isHovering);

  return (
    <div
      className={cn(
        'flex h-screen bg-gray-100 dark:bg-gray-900 transition-[padding] duration-300',
        // Always add padding for AI sidebar on large screens, or when media slider is open
        (mediaSliderOpen || aiSidebarOpen || isLargeScreen) ? 'lg:pr-[420px]' : '',
      )}
      data-sidebar-mode={(mediaSliderOpen || aiSidebarOpen || isLargeScreen) ? 'folded' : sidebarPinned ? 'pinned' : 'hover'}
    >
      {/* Sidebar */}
      <div
        onMouseEnter={() => !isScreenSmall && setIsHovering(true)}
        onMouseLeave={() => !isScreenSmall && setIsHovering(false)}
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
          isScreenSmall
            ? `w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : showExpanded
            ? 'w-64 lg:relative'
            : 'w-20 lg:relative'
        }`}
      >
        <VerticalNavigation
          navigation={currentNavigation}
          user={displayUser}
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
          collapsed={!showExpanded}
          onTogglePin={togglePin}
          sidebarPinned={sidebarPinned}
        />
      </div>

      {/* Overlay */}
      {sidebarOpen && isScreenSmall && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={toggleSidebar}
          onTogglePin={togglePin}
          sidebarPinned={sidebarPinned}
          user={displayUser}
          navigation={memoizedNavigation}
        />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-[padding] duration-300',
          )}
        >
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Wajooba. All rights reserved.
          </div>
        </footer>
      </div>
      <MediaSliderPanel />
      <AISidebarPanel />
    </div>
  );
}
