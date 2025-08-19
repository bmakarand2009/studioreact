// Application constants and configuration

export const APP_CONFIG = {
  name: 'Wisely-React',
  version: '1.0.0',
  description: 'Enterprise-Grade Learning Management System',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.wajooba.me',
  environment: process.env.NODE_ENV || 'development',
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  users: {
    base: '/users',
    profile: '/users/profile',
    organizations: '/users/organizations',
  },
  courses: {
    base: '/courses',
    modules: '/courses/:id/modules',
    lessons: '/courses/:courseId/modules/:moduleId/lessons',
  },
  organizations: {
    base: '/organizations',
    settings: '/organizations/:id/settings',
  },
} as const;

export const ROUTES = {
  public: {
    home: '/',
    about: '/about',
    courses: '/courses',
    contact: '/contact',
    login: '/login',
    register: '/register',
  },
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  dashboard: {
    home: '/dashboard',
    courses: '/dashboard/courses',
    users: '/dashboard/users',
    analytics: '/dashboard/analytics',
    settings: '/dashboard/settings',
  },
} as const;

export const USER_ROLES = {
  PUBLIC: 'public',
  STUDENT: 'student',
  ADMIN: 'admin',
  STAFF: 'staff',
} as const;

export const THEME = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      900: '#0f172a',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export const VALIDATION_RULES = {
  email: {
    required: 'Email is required',
    pattern: 'Please enter a valid email address',
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters',
    pattern: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  },
  firstName: {
    required: 'First name is required',
    minLength: 'First name must be at least 2 characters',
  },
  lastName: {
    required: 'Last name is required',
    minLength: 'Last name must be at least 2 characters',
  },
} as const;

export const STORAGE_KEYS = {
  authToken: 'wisely_auth_token',
  refreshToken: 'wisely_refresh_token',
  user: 'wisely_user',
  theme: 'wisely_theme',
  language: 'wisely_language',
} as const;

export const NOTIFICATION_DURATION = {
  short: 3000,
  medium: 5000,
  long: 8000,
} as const;
