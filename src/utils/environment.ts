/**
 * Environment Utilities
 * 
 * Helper functions for environment detection and configuration
 */

import { environment } from '@/config/environment';

/**
 * Get the current environment name
 */
export const getCurrentEnvironment = (): string => {
  return environment.current;
};

/**
 * Check if we're in development environment
 */
export const isDevelopment = (): boolean => {
  return environment.isDevelopment;
};

/**
 * Check if we're in staging environment
 */
export const isStaging = (): boolean => {
  return environment.isStaging;
};

/**
 * Check if we're in production environment
 */
export const isProduction = (): boolean => {
  return environment.isProduction;
};

/**
 * Get the API base URL for the current environment
 */
export const getApiBaseUrl = (): string => {
  return environment.apiBaseUrl;
};

/**
 * Get environment-specific API URL
 */
export const getEnvironmentApiUrl = (env: 'development' | 'staging' | 'production'): string => {
  return environment.apiUrls[env];
};

/**
 * Check if debug logs are enabled
 */
export const isDebugEnabled = (): boolean => {
  return environment.features.enableDebugLogs;
};

/**
 * Check if performance monitoring is enabled
 */
export const isPerformanceMonitoringEnabled = (): boolean => {
  return environment.features.enablePerformanceMonitoring;
};

/**
 * Get the current log level
 */
export const getLogLevel = (): string => {
  return environment.features.logLevel;
};

/**
 * Log environment information (useful for debugging)
 */
export const logEnvironmentInfo = (): void => {
  if (isDebugEnabled()) {
    console.group('🌍 Environment Information');
    console.log('Current Environment:', getCurrentEnvironment());
    console.log('API Base URL:', getApiBaseUrl());
    console.log('Debug Enabled:', isDebugEnabled());
    console.log('Performance Monitoring:', isPerformanceMonitoringEnabled());
    console.log('Log Level:', getLogLevel());
    console.groupEnd();
  }
};
