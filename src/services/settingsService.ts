import { authService } from './authService';
import { environment } from '@/config/environment';

export interface AccountSettings {
  name: string;
  accountOwner: string;
  fromEmailName: string;
  fromEmail: string;
  phone: string;
  address_line1: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  orgId: string;
  isMasterFranchise: boolean;
}

export interface WebsiteSettings {
  customDomain?: string;
  websiteTitle: string;
  websiteDescription: string;
  keywords?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  enableCustomDomain: boolean;
  enableSEO: boolean;
  enableAnalytics: boolean;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
}

export interface ModuleSettings {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: string;
}

export interface UserSettings {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar?: string;
}

export interface RoleSettings {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
  isActive?: boolean;
}

export interface PaymentSettings {
  id: string;
  provider: string;
  name: string;
  description: string;
  isActive: boolean;
  config: Record<string, any>;
  testMode: boolean;
}

export interface IntegrationSettings {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'payment' | 'analytics' | 'other';
  provider: string;
  isActive: boolean;
  config: Record<string, any>;
  lastSync?: string;
}

export interface CustomFieldSettings {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
  formType: string;
  sequence: number;
}

class SettingsService {
  private baseUrl = environment.api.baseUrl;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authService.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Account Settings
  async getAccountSettings(): Promise<AccountSettings> {
    return this.makeRequest<AccountSettings>('/snode/tenant');
  }

  async updateAccountSettings(settings: Partial<AccountSettings>): Promise<AccountSettings> {
    return this.makeRequest<AccountSettings>('/snode/tenant', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Website Settings
  async getWebsiteSettings(): Promise<WebsiteSettings> {
    return this.makeRequest<WebsiteSettings>('/rest/website/settings');
  }

  async updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    return this.makeRequest<WebsiteSettings>('/rest/website/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Module Settings
  async getModuleSettings(): Promise<ModuleSettings[]> {
    return this.makeRequest<ModuleSettings[]>('/rest/modules/settings');
  }

  async updateModuleSettings(moduleId: string, enabled: boolean): Promise<ModuleSettings> {
    return this.makeRequest<ModuleSettings>(`/rest/modules/settings/${moduleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  // User Settings
  async getUsers(search?: string, role?: string): Promise<UserSettings[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    
    return this.makeRequest<UserSettings[]>(`/rest/users?${params.toString()}`);
  }

  async createUser(userData: Partial<UserSettings>): Promise<UserSettings> {
    return this.makeRequest<UserSettings>('/rest/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<UserSettings>): Promise<UserSettings> {
    return this.makeRequest<UserSettings>(`/rest/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.makeRequest<void>(`/rest/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Role Settings
  async getRoles(): Promise<RoleSettings[]> {
    return this.makeRequest<RoleSettings[]>('/rest/roles');
  }

  async createRole(roleData: Partial<RoleSettings>): Promise<RoleSettings> {
    return this.makeRequest<RoleSettings>('/rest/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateRole(roleId: string, roleData: Partial<RoleSettings>): Promise<RoleSettings> {
    return this.makeRequest<RoleSettings>(`/rest/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteRole(roleId: string): Promise<void> {
    return this.makeRequest<void>(`/rest/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Payment Settings
  async getPaymentSettings(): Promise<PaymentSettings[]> {
    return this.makeRequest<PaymentSettings[]>('/rest/payment/providers');
  }

  async updatePaymentSettings(providerId: string, settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    return this.makeRequest<PaymentSettings>(`/rest/payment/providers/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async testPaymentConnection(providerId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/rest/payment/providers/${providerId}/test`, {
      method: 'POST',
    });
  }

  // Integration Settings
  async getIntegrations(): Promise<IntegrationSettings[]> {
    return this.makeRequest<IntegrationSettings[]>('/rest/integrations');
  }

  async updateIntegration(integrationId: string, settings: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    return this.makeRequest<IntegrationSettings>(`/rest/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async testIntegration(integrationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/rest/integrations/${integrationId}/test`, {
      method: 'POST',
    });
  }

  // Custom Field Settings
  async getCustomFields(formType?: string): Promise<CustomFieldSettings[]> {
    const params = formType ? `?customForm=${formType}` : '';
    return this.makeRequest<CustomFieldSettings[]>(`/rest/customField${params}`);
  }

  async createCustomField(fieldData: Partial<CustomFieldSettings>): Promise<CustomFieldSettings> {
    return this.makeRequest<CustomFieldSettings>('/rest/customField', {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
  }

  async updateCustomField(fieldId: string, fieldData: Partial<CustomFieldSettings>): Promise<CustomFieldSettings> {
    return this.makeRequest<CustomFieldSettings>(`/rest/customField/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(fieldData),
    });
  }

  async deleteCustomField(fieldId: string): Promise<void> {
    return this.makeRequest<void>(`/rest/customField/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  async ping(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/ping');
  }

  async getAppVersion(): Promise<{ version: string; build: string }> {
    return this.makeRequest<{ version: string; build: string }>('/plugin/app/version');
  }
}

export const settingsService = new SettingsService();
