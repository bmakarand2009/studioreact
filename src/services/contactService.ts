import { APP_CONFIG } from '@/constants';
import { authService } from './authService';

export interface ContactSearchResult {
  id: string;
  label: string;
  email?: string;
}

export class ContactService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = APP_CONFIG.apiBaseUrl || 'https://api.wajooba.me';
  }

  /**
   * Search for contacts using autocomplete
   * @param searchQuery - Search term (name, email, or phone)
   * @returns Promise with array of contact search results
   */
  async searchContacts(searchQuery: string): Promise<ContactSearchResult[]> {
    if (!searchQuery || typeof searchQuery !== 'string') {
      return [];
    }

    try {
      const token = authService.accessToken;
      const url = `${this.baseUrl}/rest/contact/?autoComplete=true&q=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Contact search failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle array response
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          id: item.id || item.guid || item._id,
          label: item.label || item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || '',
          email: item.email,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }

  /**
   * Get contact token for student preview
   * @param contactId - Contact GUID/ID
   * @returns Promise with access token string
   */
  async getContactToken(contactId: string): Promise<string> {
    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    try {
      const token = authService.accessToken;
      const url = `${this.baseUrl}/rest/contact/${contactId}/token`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get contact token: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token || data.token || data;
    } catch (error) {
      console.error('Error getting contact token:', error);
      throw error;
    }
  }

  /**
   * Store admin token for preview restoration
   * @param adminToken - Admin authentication token
   */
  setAdminAuthTokenForPreview(adminToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', adminToken);
    }
  }

  /**
   * Get stored admin token for preview restoration
   * @returns Admin token or null
   */
  getAdminAuthTokenForPreview(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  }

  /**
   * Clear stored admin token
   */
  clearAdminToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
    }
  }

  /**
   * Add a new contact/client
   * @param payload - Contact data
   * @returns Promise with created contact data including id
   */
  async addClient(payload: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone: string;
    grnNumber?: string;
    password?: string;
    hasSignedWaiverForm?: boolean;
    subscribeToMailingList?: boolean;
    detailedCustomFields?: any[];
  }): Promise<{ id: string; [key: string]: any }> {
    try {
      const token = authService.accessToken;
      const url = `${this.baseUrl}/rest/contact/`;
      
      // Ensure detailedCustomFields is always an array
      const requestPayload = {
        ...payload,
        detailedCustomFields: payload.detailedCustomFields || [],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to add contact: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (data.error) {
        throw new Error(data.error.error?.message || data.error.message || 'Failed to add contact');
      }

      return {
        id: data.id || data.guId || data._id || data.guid,
        ...data,
      };
    } catch (error: any) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }
}

export const contactService = new ContactService();
