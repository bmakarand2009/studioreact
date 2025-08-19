import type { Environment, EnvironmentConfig } from './index';

export const productionConfig: EnvironmentConfig = {
  name: 'production' as Environment,
  apiBaseUrl: 'https://api.onwajooba.com',
  enableDebugLogs: false,
  enableMockData: false,
  enablePerformanceMonitoring: true,
  logLevel: 'error' as const,
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

export default productionConfig;
