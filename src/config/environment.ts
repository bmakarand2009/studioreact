/**
 * Environment Configuration (Vite)
 * 
 * This file contains environment-specific configuration values.
 * This is a PURE FRONTEND application with no backend dependencies.
 * All data comes from external APIs.
 * 
 * Environment URLs:
 * - Development: api.wajooba.me
 * - Staging: api.wajooba.xyz
 * - Production: api.onwajooba.com
 */

// Environment configuration for the application
export const environment = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: 30000,
    retryAttempts: 3,
  },

  // Application Configuration
  app: {
    name: 'Wajooba LMS',
    // version: import.meta.env.VITE_APP_VERSION,
    // environment: import.meta.env.MODE || (import.meta.env.DEV ? 'development' : 'production'),
  },

  // Feature Flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebugMode: import.meta.env.DEV,
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  },

  // Authentication Configuration
  auth: {
    tokenKey: 'wajooba_auth_token',
    refreshTokenKey: 'wajooba_refresh_token',
    tokenExpiryKey: 'wajooba_token_expiry',
    userDataKey: 'wajooba_user_data',
  },

  // UI Configuration
  ui: {
    theme: {
      default: 'light',
      storageKey: 'wajooba_theme',
    },
    language: {
      default: 'en',
      storageKey: 'wajooba_language',
    },
  },

  // External Services
  external: {
    googleAnalytics: {
      id: import.meta.env.VITE_GA_ID,
      enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    },
    sentry: {
      dsn: import.meta.env.VITE_SENTRY_DSN,
      enabled: import.meta.env.VITE_ENABLE_SENTRY === 'true',
    },
  },
};

// Helper function to check if we're in development mode
export const isDevelopment = environment.app.environment === 'development';

// Helper function to check if we're in production mode
export const isProduction = environment.app.environment === 'production';

// Helper function to get API URL with endpoint
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = environment.api.baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Helper function to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof environment.features): boolean => {
  return environment.features[feature] || false;
};

// Helper function to get environment variable with fallback
export const getEnvVar = (key: string, fallback: string = ''): string => {
  const env = import.meta.env as Record<string, string>;
  return env[key] || fallback;
};

// Export default environment
export default environment;
