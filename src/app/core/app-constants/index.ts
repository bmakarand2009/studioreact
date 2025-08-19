/**
 * Application Constants
 * Centralized configuration for the Wisely-React application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.wajooba.me',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: 'Wisely-React',
  VERSION: '1.0.0',
  DESCRIPTION: 'Enterprise Learning Management System',
  COMPANY: 'Wajooba',
  SUPPORT_EMAIL: 'support@wajooba.me',
} as const;

// Feature Flags
export const FEATURES = {
  DARK_MODE: true,
  MULTI_TENANT: true,
  REAL_TIME_NOTIFICATIONS: true,
  OFFLINE_SUPPORT: false,
  PWA: false,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  USER_SESSION: 24 * 60 * 60 * 1000, // 24 hours
  API_RESPONSES: 5 * 60 * 1000, // 5 minutes
  STATIC_CONTENT: 60 * 60 * 1000, // 1 hour
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'wisely-auth-token',
  REFRESH_TOKEN: 'wisely-refresh-token',
  USER_PREFERENCES: 'wisely-user-preferences',
  THEME: 'wisely-theme',
  COLOR_SCHEME: 'wisely-color-scheme',
  TENANT_ID: 'wisely-tenant-id',
  LANGUAGE: 'wisely-language',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  USERS: '/users',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  GUEST: 'guest',
} as const;

// Permission Levels
export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/*', 'application/pdf', 'text/*'],
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_TIME: 'yyyy-MM-dd HH:mm:ss',
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 254,
  NAME_MAX_LENGTH: 100,
} as const;

// Theme Configuration
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// Color Schemes
export const COLOR_SCHEMES = {
  DEFAULT: 'default',
  BRAND: 'brand',
  TEAL: 'teal',
  ROSE: 'rose',
  PURPLE: 'purple',
  AMBER: 'amber',
} as const;

// Breakpoints
export const BREAKPOINTS = {
  XS: 480,
  SM: 600,
  MD: 960,
  LG: 1280,
  XL: 1440,
  XXL: 1920,
} as const;

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;
