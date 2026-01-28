import { APP_CONFIG } from '@/constants';
import { authService } from './authService';

export interface TenantEmail {
  _id: string;
  userName: string;
  productName: string;
}

export interface SendEmailPayload {
  providerId: string;
  tenantId: string;
  productId?: string;
  productType?: string;
  batchId?: string;
  cc?: string;
  subject: string;
  toEmail?: string;
  emailBody: string;
}

class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = APP_CONFIG.apiBaseUrl || 'https://api.wajooba.me';
  }

  private getAuthToken(): string | null {
    const nameEQ = 'accessToken=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private buildHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Get available email providers for the tenant
   * @returns Promise with array of email providers
   */
  async getProvidersEmail(): Promise<TenantEmail[]> {
    try {
      const response = await fetch(`${this.baseUrl}/authmgr/oauth/providers/mail`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get email providers: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter out zohomail if needed
      if (Array.isArray(data)) {
        return data.filter((email: TenantEmail) => email.productName !== 'zohomail');
      }

      return [];
    } catch (error) {
      console.error('Error getting email providers:', error);
      throw error;
    }
  }

  /**
   * Send an email
   * @param payload - Email payload
   * @returns Promise with result
   */
  async sendEmail(payload: SendEmailPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/esend/email/provider`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to send email: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
