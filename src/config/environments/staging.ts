/**
 * Staging Environment Configuration
 */

import type { Environment, EnvironmentConfig } from './index';

export const stagingConfig: EnvironmentConfig = {
  name: 'staging' as Environment,
  apiBaseUrl: 'https://api.wajooba.xyz',
  enableDebugLogs: true,
  enableMockData: false,
  enablePerformanceMonitoring: true,
  logLevel: 'info' as const,
  features: {
    enableOAuth: true,
    enableSocialLogin: true,
    enableMultiTenancy: true,
    enableAnalytics: true,
  },
  defaultTenantId: 'default',
  brandColors: {
    primary: '#0055a6',
    secondary: '#00c6d8',
    tertiary: '#ff8854',
    accent: '#ff1a00',
  },
};

export default stagingConfig;
