/**
 * Development Environment Configuration
 */

import type { Environment, EnvironmentConfig } from './index';

export const developmentConfig: EnvironmentConfig = {
  name: 'development' as Environment,
  apiBaseUrl: 'https://api.wajooba.me',
  enableDebugLogs: true,
  enableMockData: false,
  enablePerformanceMonitoring: true,
  logLevel: 'debug' as const,
  features: {
    enableOAuth: true,
    enableSocialLogin: true,
    enableMultiTenancy: true,
    enableAnalytics: false,
  },
  defaultTenantId: 'default',
  brandColors: {
    primary: '#0055a6',
    secondary: '#00c6d8',
    tertiary: '#ff8854',
    accent: '#ff1a00',
  },
};

export default developmentConfig;
