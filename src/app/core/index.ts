/**
 * Core Services Index
 * Central export point for all core services and types
 */

// App Constants
export * from './app-constants';

// Authentication Service
export * from './auth';

// Navigation Service
export * from './navigation';

// Tenant Service
export * from './tenant';

// App Load Service
export * from './app-load';

// Icons Service
export * from './icons';

// Window Reference Service
export * from './window-reference';

// User Service
export * from './user';

// Transloco Service
export * from './transloco';

// Re-export service instances for convenience
export { authService } from './auth';
export { navigationService } from './navigation';
export { tenantService } from './tenant';
export { appLoadService } from './app-load';
export { iconService } from './icons';
export { windowReferenceService } from './window-reference';
export { userService } from './user';
export { translocoService } from './transloco';
