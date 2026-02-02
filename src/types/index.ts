// Core types for Wisely-React Enterprise LMS

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export enum UserRole {
  PUBLIC = 'public',
  STUDENT = 'student',
  ADMIN = 'admin',
  STAFF = 'staff'
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  theme: ThemeConfig;
  features: FeatureFlags;
  branding: BrandingConfig;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  favicon: string;
}

export interface FeatureFlags {
  ecommerce: boolean;
  assessments: boolean;
  calendar: boolean;
  donations: boolean;
  emailCampaigns: boolean;
}

export interface BrandingConfig {
  companyName: string;
  tagline?: string;
  contactEmail: string;
  website: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  instructorId: string;
  price: number;
  isPublished: boolean;
  modules: CourseModule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: LessonType;
  duration: number; // in minutes
  order: number;
}

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment'
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: ModalState;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

export interface ModalState {
  [key: string]: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export * from './checkout';
