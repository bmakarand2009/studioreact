/**
 * Navigation Service
 * Handles application navigation, menu structure, and route management
 */

import { ROUTES, USER_ROLES, PERMISSIONS } from '../app-constants';
import type { User } from '../auth';

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  roles?: string[];
  permissions?: string[];
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
}

export interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
  roles?: string[];
  permissions?: string[];
}

export interface BreadcrumbItem {
  title: string;
  path: string;
  active?: boolean;
}

class NavigationService {
  private navigationItems: NavigationItem[] = [];
  private navigationGroups: NavigationGroup[] = [];

  constructor() {
    this.initializeNavigation();
  }

  /**
   * Initialize navigation structure
   */
  private initializeNavigation(): void {
    this.navigationItems = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        path: ROUTES.DASHBOARD,
        icon: 'dashboard',
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT],
      },
      {
        id: 'courses',
        title: 'Courses',
        path: ROUTES.COURSES,
        icon: 'school',
        children: [
          {
            id: 'all-courses',
            title: 'All Courses',
            path: `${ROUTES.COURSES}/all`,
            roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT],
          },
          {
            id: 'my-courses',
            title: 'My Courses',
            path: `${ROUTES.COURSES}/my`,
            roles: [USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT],
          },
          {
            id: 'create-course',
            title: 'Create Course',
            path: `${ROUTES.COURSES}/create`,
            roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR],
            permissions: [PERMISSIONS.WRITE],
          },
        ],
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT],
      },
      {
        id: 'users',
        title: 'Users',
        path: ROUTES.USERS,
        icon: 'people',
        children: [
          {
            id: 'all-users',
            title: 'All Users',
            path: `${ROUTES.USERS}/all`,
            roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
            permissions: [PERMISSIONS.READ],
          },
          {
            id: 'create-user',
            title: 'Create User',
            path: `${ROUTES.USERS}/create`,
            roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
            permissions: [PERMISSIONS.WRITE],
          },
        ],
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
      },
      {
        id: 'settings',
        title: 'Settings',
        path: ROUTES.SETTINGS,
        icon: 'settings',
        children: [
          {
            id: 'profile',
            title: 'Profile',
            path: ROUTES.PROFILE,
            roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT],
          },
          {
            id: 'account',
            title: 'Account',
            path: `${ROUTES.SETTINGS}/account`,
            roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT],
          },
          {
            id: 'system',
            title: 'System',
            path: `${ROUTES.SETTINGS}/system`,
            roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
            permissions: [PERMISSIONS.ADMIN],
          },
        ],
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT],
      },
    ];

    this.navigationGroups = [
      {
        id: 'main',
        title: 'Main',
        items: this.navigationItems.filter(item => 
          ['dashboard', 'courses'].includes(item.id)
        ),
      },
      {
        id: 'administration',
        title: 'Administration',
        items: this.navigationItems.filter(item => 
          ['users', 'settings'].includes(item.id)
        ),
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
      },
    ];
  }

  /**
   * Get navigation items for a specific user
   */
  getNavigationItems(user: User | null): NavigationItem[] {
    if (!user) {
      return this.navigationItems.filter(item => 
        !item.roles || item.roles.includes(USER_ROLES.GUEST)
      );
    }

    return this.navigationItems.filter(item => {
      // Check role access
      if (item.roles && !item.roles.includes(user.role)) {
        return false;
      }

      // Check permission access
      if (item.permissions && !item.permissions.some(permission => 
        user.permissions.includes(permission)
      )) {
        return false;
      }

      // Check children permissions
      if (item.children) {
        item.children = item.children.filter(child => {
          if (child.roles && !child.roles.includes(user.role)) {
            return false;
          }
          if (child.permissions && !child.permissions.some(permission => 
            user.permissions.includes(permission)
          )) {
            return false;
          }
          return true;
        });
      }

      return true;
    });
  }

  /**
   * Get navigation groups for a specific user
   */
  getNavigationGroups(user: User | null): NavigationGroup[] {
    if (!user) {
      return this.navigationGroups.filter(group => 
        !group.roles || group.roles.includes(USER_ROLES.GUEST)
      );
    }

    return this.navigationGroups.filter(group => {
      if (group.roles && !group.roles.includes(user.role)) {
        return false;
      }

      if (group.permissions && !group.permissions.some(permission => 
        user.permissions.includes(permission)
      )) {
        return false;
      }

      // Filter items within groups
      group.items = group.items.filter(item => {
        if (item.roles && !item.roles.includes(user.role)) {
          return false;
        }
        if (item.permissions && !item.permissions.some(permission => 
          user.permissions.includes(permission)
        )) {
          return false;
        }
        return true;
      });

      return group.items.length > 0;
    });
  }

  /**
   * Get breadcrumbs for a specific path
   */
  getBreadcrumbs(path: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
      { title: 'Home', path: ROUTES.HOME },
    ];

    // Find the matching navigation item
    const findItem = (items: NavigationItem[], currentPath: string): NavigationItem | null => {
      for (const item of items) {
        if (item.path === currentPath) {
          return item;
        }
        if (item.children) {
          const found = findItem(item.children, currentPath);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    const currentItem = findItem(this.navigationItems, path);
    if (currentItem) {
      // Find parent items
      const findParent = (items: NavigationItem[], targetId: string): NavigationItem | null => {
        for (const item of items) {
          if (item.children) {
            for (const child of item.children) {
              if (child.id === targetId) {
                return item;
              }
            }
            const found = findParent(item.children, targetId);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      const parent = findParent(this.navigationItems, currentItem.id);
      if (parent) {
        breadcrumbs.push({ title: parent.title, path: parent.path });
      }

      breadcrumbs.push({ title: currentItem.title, path: currentItem.path, active: true });
    }

    return breadcrumbs;
  }

  /**
   * Check if a user can access a specific path
   */
  canAccessPath(user: User | null, path: string): boolean {
    if (!user) {
      return path === ROUTES.HOME || path === ROUTES.LOGIN || path === ROUTES.REGISTER;
    }

    const findItem = (items: NavigationItem[], targetPath: string): NavigationItem | null => {
      for (const item of items) {
        if (item.path === targetPath) {
          return item;
        }
        if (item.children) {
          const found = findItem(item.children, targetPath);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    const item = findItem(this.navigationItems, path);
    if (!item) {
      return false;
    }

    // Check role access
    if (item.roles && !item.roles.includes(user.role)) {
      return false;
    }

    // Check permission access
    if (item.permissions && !item.permissions.some(permission => 
      user.permissions.includes(permission)
    )) {
      return false;
    }

    return true;
  }

  /**
   * Get navigation item by ID
   */
  getNavigationItemById(id: string): NavigationItem | null {
    const findItem = (items: NavigationItem[], targetId: string): NavigationItem | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return item;
        }
        if (item.children) {
          const found = findItem(item.children, targetId);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    return findItem(this.navigationItems, id);
  }

  /**
   * Get navigation item by path
   */
  getNavigationItemByPath(path: string): NavigationItem | null {
    const findItem = (items: NavigationItem[], targetPath: string): NavigationItem | null => {
      for (const item of items) {
        if (item.path === targetPath) {
          return item;
        }
        if (item.children) {
          const found = findItem(item.children, targetPath);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    return findItem(this.navigationItems, path);
  }

  /**
   * Add custom navigation item
   */
  addNavigationItem(item: NavigationItem): void {
    this.navigationItems.push(item);
  }

  /**
   * Remove navigation item by ID
   */
  removeNavigationItem(id: string): void {
    this.navigationItems = this.navigationItems.filter(item => item.id !== id);
  }

  /**
   * Update navigation item
   */
  updateNavigationItem(id: string, updates: Partial<NavigationItem>): void {
    const item = this.getNavigationItemById(id);
    if (item) {
      Object.assign(item, updates);
    }
  }
}

// Export singleton instance
export const navigationService = new NavigationService();
