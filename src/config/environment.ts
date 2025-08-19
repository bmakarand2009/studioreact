/**
 * Environment Configuration
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

import { 
  developmentConfig, 
  stagingConfig, 
  productionConfig,
  type Environment,
  type EnvironmentConfig 
} from './environments';

// Get current environment
const getCurrentEnvironment = (): Environment => {
  const env = process.env.NEXT_PUBLIC_ENV;
  const nodeEnv = process.env.NODE_ENV;
  
  if (env === 'staging') return 'staging';
  if (env === 'production') return 'production';
  if (nodeEnv === 'production') return 'production';
  
  return 'development';
};

// Get environment configuration
const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = getCurrentEnvironment();
  
  switch (env) {
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
};

const currentEnv = getCurrentEnvironment();
const envConfig = getEnvironmentConfig();

export const environment = {
  // Current Environment
  current: currentEnv,
  config: envConfig,
  
  // Environment Detection
  isDevelopment: currentEnv === 'development',
  isStaging: currentEnv === 'staging',
  isProduction: currentEnv === 'production',
  
  // API Configuration - From environment config
  apiBaseUrl: envConfig.apiBaseUrl,
  
  // Environment-specific API URLs
  apiUrls: {
    development: 'https://api.wajooba.me',
    staging: 'https://api.wajooba.xyz',
    production: 'https://api.onwajooba.com'
  },
  
  // App Configuration
  appName: 'Wajooba React',
  appVersion: '1.0.0',
  
  // Architecture Type
  isPureFrontend: true,
  hasNoBackend: true,
  
  // Feature Flags - From environment config
  enableOAuth: envConfig.features.enableOAuth,
  enableSocialLogin: envConfig.features.enableSocialLogin,
  enableMultiTenancy: envConfig.features.enableMultiTenancy,
  enableAnalytics: envConfig.features.enableAnalytics,
  
  // Default Tenant
  defaultTenantId: 'default',
  
  // Brand Colors
  brandColors: {
    primary: '#0055a6',
    secondary: '#00c6d8',
    tertiary: '#ff8854',
    accent: '#ff1a00',
  },
  
  // Environment-specific features
  features: {
    enableDebugLogs: envConfig.enableDebugLogs,
    enableMockData: envConfig.enableMockData,
    enablePerformanceMonitoring: envConfig.enablePerformanceMonitoring,
    logLevel: envConfig.logLevel
  }
};

export default environment;
