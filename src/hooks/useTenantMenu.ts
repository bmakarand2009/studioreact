import { useState, useEffect, useMemo } from 'react';
import { appLoadService, Web } from '@/app/core/app-load';

export interface MenuItem {
  id: string;
  title: string;
  type: string;
  url: string;
  externalLink?: string | null;
  isExternalLink: boolean;
  sequence: number;
  isShowNavigation: boolean;
  isShowFooter: boolean;
  isLegal: boolean;
}

/**
 * Hook to get dynamic menu items from tenant web configuration
 */
export function useTenantMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setIsLoading(true);
        // Try to get cached tenant details first, otherwise initialize
        let tenantDetails = appLoadService.tenantDetails;
        if (!tenantDetails) {
          tenantDetails = await appLoadService.initAppConfig();
        }
        
        if (tenantDetails?.web && Array.isArray(tenantDetails.web)) {
          // Transform Web items to MenuItem format
          const items: MenuItem[] = tenantDetails.web
            .sort((a: Web, b: Web) => a.sequence - b.sequence) // Sort by sequence first
            .map((item: Web) => ({
              id: item.name,
              title: item.title,
              type: 'item',
              url: item.isExternalLink && item.externalLink 
                ? item.externalLink 
                : `/${item.url}`,
              externalLink: item.externalLink,
              isExternalLink: item.isExternalLink,
              sequence: item.sequence,
              isShowNavigation: item.isShowNavigation,
              isShowFooter: item.isShowFooter,
              isLegal: (item as any).isLegal || false, // Type assertion for backward compatibility
            }));
          
          setMenuItems(items);
        } else {
          // Fallback to empty array if no web items
          setMenuItems([]);
        }
      } catch (error) {
        console.error('Failed to load tenant menu items:', error);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  // Get navigation items (filtered by isShowNavigation and exclude legal items)
  const navigationItems = useMemo(() => {
    return menuItems.filter(item => item.isShowNavigation && !item.isLegal);
  }, [menuItems]);

  // Get footer items (filtered by isShowFooter)
  const footerItems = useMemo(() => {
    return menuItems.filter(item => item.isShowFooter);
  }, [menuItems]);

  // Get legal items (for footer)
  const legalItems = useMemo(() => {
    return menuItems.filter(item => item.isLegal && item.isShowFooter);
  }, [menuItems]);

  return {
    menuItems,
    navigationItems,
    footerItems,
    legalItems,
    isLoading,
  };
}
