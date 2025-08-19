/**
 * Environment Configurations Index
 * 
 * Exports all environment-specific configurations
 */

export { default as developmentConfig } from './development';
export { default as stagingConfig } from './staging';
export { default as productionConfig } from './production';

// Environment type
export type Environment = 'development' | 'staging' | 'production';

// Environment configuration type
export interface EnvironmentConfig {
  name: Environment;
  apiBaseUrl: string;
  enableDebugLogs: boolean;
  enableMockData: boolean;
  enablePerformanceMonitoring: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: {
    enableOAuth: boolean;
    enableSocialLogin: boolean;
    enableMultiTenancy: boolean;
    enableAnalytics: boolean;
  };
  defaultTenantId: string;
  brandColors: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
  };
}
