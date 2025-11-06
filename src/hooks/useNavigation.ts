

import { useState, useEffect, useMemo } from 'react';
import { navigationService } from '@/app/core';
import type { NavigationItem as ServiceNavigationItem } from '@/app/core/navigation';

interface NavigationItem {
  id: string;
  title: string;
  type: string;
  icon?: string;
  url: string;
}

interface NavigationState {
  adminNavigation: NavigationItem[];
  studentNavigation: NavigationItem[];
  publicNavigation: NavigationItem[];
}

export function useNavigation() {
  const [navigation, setNavigation] = useState<NavigationState>({
    adminNavigation: [],
    studentNavigation: [],
    publicNavigation: [],
  });

  useEffect(() => {
    // Load navigation data
    const loadNavigation = async () => {
      try {
        // For now, we'll use default navigation since we don't have a user context
        // In a real app, you'd get the user from auth context
        setNavigation({
          adminNavigation: getDefaultAdminNavigation(),
          studentNavigation: getDefaultStudentNavigation(),
          publicNavigation: getDefaultPublicNavigation(),
        });
      } catch (error) {
        console.error('Failed to load navigation:', error);
        // Set default navigation structure
        setNavigation({
          adminNavigation: getDefaultAdminNavigation(),
          studentNavigation: getDefaultStudentNavigation(),
          publicNavigation: getDefaultPublicNavigation(),
        });
      }
    };

    loadNavigation();
  }, []);

  // Memoize the navigation object to prevent unnecessary re-renders
  const memoizedNavigation = useMemo(() => navigation, [navigation]);

  return { navigation: memoizedNavigation };
}

// Default navigation structures
function getDefaultAdminNavigation(): NavigationItem[] {
  return [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      icon: 'home',
      url: '/admin/dashboard',
    },
    {
      id: 'users',
      title: 'Users',
      type: 'item',
      icon: 'users',
      url: '/admin/users',
    },
    {
      id: 'courses',
      title: 'Courses',
      type: 'item',
      icon: 'book',
      url: '/admin/courses',
    },
    {
      id: 'events',
      title: 'Events',
      type: 'item',
      icon: 'calendar',
      url: '/admin/events',
    },
    {
      id: 'reports',
      title: 'Reports',
      type: 'item',
      icon: 'bar-chart',
      url: '/admin/reports',
    },

    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      icon: 'settings',
      url: '/admin/settings',
    },
  ];
}

function getDefaultStudentNavigation(): NavigationItem[] {
  return [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      icon: 'home',
      url: '/student/dashboard',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      type: 'item',
      icon: 'calendar',
      url: '/student/calendar',
    },
    {
      id: 'courses',
      title: 'Courses',
      type: 'item',
      icon: 'book',
      url: '/student/courses',
    },
    {
      id: 'store',
      title: 'My Store',
      type: 'item',
      icon: 'shopping-cart',
      url: '/student/store',
    },
    {
      id: 'assessments',
      title: 'Assessments',
      type: 'item',
      icon: 'clipboard-check',
      url: '/student/assessments',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      type: 'item',
      icon: 'file-text',
      url: '/student/assignments',
    },
    {
      id: 'grades',
      title: 'Grades',
      type: 'item',
      icon: 'award',
      url: '/student/grades',
    },
  ];
}

function getDefaultPublicNavigation(): NavigationItem[] {
  return [
    {
      id: 'home',
      title: 'Home',
      type: 'item',
      url: '/',
    },
    {
      id: 'about',
      title: 'About',
      type: 'item',
      url: '/about',
    },
    {
      id: 'features',
      title: 'Features',
      type: 'item',
      url: '/features',
    },
    {
      id: 'contact',
      title: 'Contact',
      type: 'item',
      url: '/contact',
    },
  ];
}
