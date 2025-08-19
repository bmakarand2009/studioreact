'use client';

import { useState, useEffect } from 'react';
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

  return { navigation };
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
      id: 'reports',
      title: 'Reports',
      type: 'item',
      icon: 'bar-chart',
      url: '/admin/reports',
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
      id: 'courses',
      title: 'My Courses',
      type: 'item',
      icon: 'book',
      url: '/student/courses',
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
