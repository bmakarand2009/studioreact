/**
 * Tenant Service
 * Handles multi-tenant architecture, tenant switching, and tenant-specific configurations
 */

import { STORAGE_KEYS, API_CONFIG } from '../app-constants';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: string;
  features: string[];
  settings: TenantSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  allowSocialLogin: boolean;
  maxUsers: number;
  maxStorage: number;
  customBranding: boolean;
  analytics: boolean;
  notifications: boolean;
}

export interface TenantConfig {
  apiUrl: string;
  cdnUrl: string;
  websocketUrl: string;
  features: string[];
}

class TenantService {
  private currentTenant: Tenant | null = null;
  private tenantConfig: TenantConfig | null = null;
  private availableTenants: Tenant[] = [];

  constructor() {
    this.initializeTenant();
  }

  /**
   * Initialize tenant from storage or URL
   */
  private async initializeTenant(): Promise<void> {
    try {
      // Try to get tenant from storage first
      const storedTenantId = localStorage.getItem(STORAGE_KEYS.TENANT_ID);
      if (storedTenantId) {
        await this.setCurrentTenant(storedTenantId);
        return;
      }

      // Try to detect tenant from URL
      const detectedTenant = this.detectTenantFromUrl();
      if (detectedTenant) {
        await this.setCurrentTenant(detectedTenant);
        return;
      }

      // Set default tenant
      await this.setDefaultTenant();
    } catch (error) {
      console.error('Error initializing tenant:', error);
      await this.setDefaultTenant();
    }
  }

  /**
   * Detect tenant from URL
   */
  private detectTenantFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];

    // Check if it's a valid subdomain
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }

    return null;
  }

  /**
   * Set default tenant
   */
  private async setDefaultTenant(): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/default`);
      if (response.ok) {
        const defaultTenant: Tenant = await response.json();
        await this.setCurrentTenant(defaultTenant.id);
      }
    } catch (error) {
      console.error('Error setting default tenant:', error);
    }
  }

  /**
   * Set current tenant
   */
  async setCurrentTenant(tenantId: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/${tenantId}`);
      if (!response.ok) {
        throw new Error('Tenant not found');
      }

      const tenant: Tenant = await response.json();
      this.currentTenant = tenant;

      // Get tenant configuration
      await this.loadTenantConfig(tenantId);

      // Store tenant ID
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, tenantId);

      // Update document title and favicon
      this.updateDocumentMetadata(tenant);
    } catch (error) {
      console.error('Error setting tenant:', error);
      throw error;
    }
  }

  /**
   * Load tenant configuration
   */
  private async loadTenantConfig(tenantId: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/${tenantId}/config`);
      if (response.ok) {
        this.tenantConfig = await response.json();
      }
    } catch (error) {
      console.error('Error loading tenant config:', error);
    }
  }

  /**
   * Update document metadata based on tenant
   */
  private updateDocumentMetadata(tenant: Tenant): void {
    if (typeof document === 'undefined') return;

    // Update title
    if (tenant.name) {
      document.title = `${tenant.name} - Wisely-React`;
    }

    // Update favicon
    if (tenant.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = tenant.favicon;
      }
    }

    // Update theme colors
    if (tenant.primaryColor) {
      document.documentElement.style.setProperty('--primary', tenant.primaryColor);
    }
    if (tenant.secondaryColor) {
      document.documentElement.style.setProperty('--secondary', tenant.secondaryColor);
    }
  }

  /**
   * Get current tenant
   */
  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }

  /**
   * Get tenant configuration
   */
  getTenantConfig(): TenantConfig | null {
    return this.tenantConfig;
  }

  /**
   * Get available tenants for user
   */
  async getAvailableTenants(): Promise<Tenant[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/available`);
      if (response.ok) {
        this.availableTenants = await response.json();
        return this.availableTenants;
      }
      return [];
    } catch (error) {
      console.error('Error fetching available tenants:', error);
      return [];
    }
  }

  /**
   * Switch to different tenant
   */
  async switchTenant(tenantId: string): Promise<void> {
    if (this.currentTenant?.id === tenantId) {
      return; // Already on this tenant
    }

    await this.setCurrentTenant(tenantId);
    
    // Reload page to apply new tenant settings
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /**
   * Check if feature is enabled for current tenant
   */
  isFeatureEnabled(feature: string): boolean {
    if (!this.currentTenant) return false;
    return this.currentTenant.features.includes(feature);
  }

  /**
   * Check if setting is enabled for current tenant
   */
  isSettingEnabled(setting: keyof TenantSettings): boolean {
    if (!this.currentTenant) return false;
    return this.currentTenant.settings[setting];
  }

  /**
   * Get tenant-specific API URL
   */
  getTenantApiUrl(): string {
    if (this.tenantConfig?.apiUrl) {
      return this.tenantConfig.apiUrl;
    }
    return API_CONFIG.BASE_URL;
  }

  /**
   * Get tenant-specific CDN URL
   */
  getTenantCdnUrl(): string {
    return this.tenantConfig?.cdnUrl || '';
  }

  /**
   * Get tenant-specific websocket URL
   */
  getTenantWebsocketUrl(): string {
    return this.tenantConfig?.websocketUrl || '';
  }

  /**
   * Create new tenant
   */
  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tenant');
      }

      const newTenant: Tenant = await response.json();
      this.availableTenants.push(newTenant);
      
      return newTenant;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create tenant');
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update tenant');
      }

      const updatedTenant: Tenant = await response.json();
      
      // Update local tenant if it's the current one
      if (this.currentTenant?.id === tenantId) {
        this.currentTenant = updatedTenant;
        this.updateDocumentMetadata(updatedTenant);
      }

      // Update in available tenants list
      const index = this.availableTenants.findIndex(t => t.id === tenantId);
      if (index !== -1) {
        this.availableTenants[index] = updatedTenant;
      }

      return updatedTenant;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update tenant');
    }
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete tenant');
      }

      // Remove from available tenants
      this.availableTenants = this.availableTenants.filter(t => t.id !== tenantId);

      // If current tenant is deleted, switch to default
      if (this.currentTenant?.id === tenantId) {
        await this.setDefaultTenant();
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete tenant');
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/${tenantId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  /**
   * Search tenants
   */
  async searchTenants(query: string): Promise<Tenant[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tenants/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error searching tenants:', error);
      return [];
    }
  }
}

// Export singleton instance
export const tenantService = new TenantService();
