/**
 * Environment Configuration (Vite + Docker Runtime)
 * 
 * This file supports both Vite's build-time and Docker runtime environment variables.
 * 
 * Vite automatically loads environment files based on mode:
 * - .env                    # loaded in all cases
 * - .env.local              # loaded in all cases, ignored by git
 * - .env.[mode]             # loaded only in specified mode (e.g., .env.development)
 * - .env.[mode].local        # loaded only in specified mode, ignored by git
 * 
 * Mode is determined by:
 * - `--mode` flag: vite build --mode production
 * - Default: 'development' for `vite dev`, 'production' for `vite build`
 * 
 * Environment URLs:
 * - Development: /api (proxied to api.wajooba.me in dev to avoid CORS) or set VITE_API_URL in .env.development
 * - Staging: api.wajooba.xyz (.env.staging)
 * - Production: api.onwajooba.com (.env.production)
 * 
 * For Railway/Docker:
 * Environment variables are checked in this order:
 * 1. process.env.[KEY] - Runtime Docker variables (without VITE_ prefix)
 * 2. process.env.VITE_[KEY] - Runtime Docker variables (with VITE_ prefix)
 * 3. import.meta.env.VITE_[KEY] - Vite build-time variables
 * 
 * This allows Docker to inject environment variables at runtime without rebuilds,
 * while still supporting Vite's standard build-time embedding.
 * 
 * Example: getEnvVar('WAJOOBA_API_KEY') checks:
 *   process.env.WAJOOBA_API_KEY || process.env.VITE_WAJOOBA_API_KEY || import.meta.env.VITE_WAJOOBA_API_KEY
 */

/**
 * Get environment variable supporting both Docker runtime and Vite build-time variables
 * 
 * Priority (matching pattern: process.env.WAJOOBA_API_KEY || process.env.VITE_WAJOOBA_API_KEY):
 * 1. process.env.[KEY] - Runtime Docker environment variables (without VITE_ prefix)
 * 2. process.env.VITE_[KEY] - Runtime Docker environment variables (with VITE_ prefix)
 * 3. import.meta.env.VITE_[KEY] - Vite build-time environment variables
 * 
 * This allows flexibility for Docker deployments where env vars can be injected at runtime
 * without requiring a rebuild, while still supporting Vite's standard build-time embedding.
 * 
 * @param key - Environment variable key (with or without VITE_ prefix)
 * @param fallback - Default value if not found
 * @example
 *   getEnvVar('WAJOOBA_API_KEY') // Checks: process.env.WAJOOBA_API_KEY || process.env.VITE_WAJOOBA_API_KEY || import.meta.env.VITE_WAJOOBA_API_KEY
 *   getEnvVar('VITE_API_URL') // Checks: process.env.VITE_API_URL || process.env.API_URL || import.meta.env.VITE_API_URL
 */
function getEnvVar(key: string, fallback: string = ''): string {
  // Normalize key: if it starts with VITE_, extract base key
  const baseKey = key.startsWith('VITE_') ? key.slice(5) : key;
  const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  
  // Check runtime Docker environment variables (without VITE_ prefix)
  if (typeof process !== 'undefined' && process.env) {
    const runtimeValue = process.env[baseKey];
    if (runtimeValue !== undefined && runtimeValue !== null && runtimeValue !== '') {
      return String(runtimeValue);
    }
    
    // Check runtime Docker environment variables (with VITE_ prefix)
    const viteRuntimeValue = process.env[viteKey];
    if (viteRuntimeValue !== undefined && viteRuntimeValue !== null && viteRuntimeValue !== '') {
      return String(viteRuntimeValue);
    }
  }
  
  // Fallback to Vite build-time environment variables
  const env = import.meta.env as Record<string, unknown>;
  const value = env[viteKey];
  if (value !== undefined && value !== null && value !== '') {
    return String(value);
  }
  
  return fallback;
}

// Export the function for use in other files
export { getEnvVar };

// Environment configuration for the application
export const environment = {
  // API Configuration
  api: {
    baseUrl: getEnvVar('VITE_API_URL', 'https://api.wajooba.me'),
    timeout: 30000,
    retryAttempts: 3,
  },

  // Application Configuration
  app: {
    name: 'Wajooba LMS',
    // version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: import.meta.env.MODE || (import.meta.env.DEV ? 'development' : 'production'),
  },

  // Feature Flags
  features: {
    enableAnalytics: getEnvVar('VITE_ENABLE_ANALYTICS', 'false') === 'true',
    enableDebugMode: import.meta.env.DEV || getEnvVar('VITE_ENABLE_DEBUG', 'false') === 'true',
    enableMockData: getEnvVar('VITE_ENABLE_MOCK_DATA', 'false') === 'true',
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
      id: getEnvVar('VITE_GA_ID', ''),
      enabled: getEnvVar('VITE_ENABLE_ANALYTICS', 'false') === 'true',
    },
    sentry: {
      dsn: getEnvVar('VITE_SENTRY_DSN', ''),
      enabled: getEnvVar('VITE_ENABLE_SENTRY', 'false') === 'true',
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


// Export default environment
export default environment;
