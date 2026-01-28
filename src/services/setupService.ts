import { environment } from '@/config/environment';

export interface EmailTemplate {
  _id: string;
  name: string;
}

export interface CustomForm {
  guId: string;
  name: string;
}

export interface Test {
  _id: string;
  name: string;
}

export interface Product {
  guId: string;
  name: string;
  categoryType: 'SERVICE' | 'PRODUCT' | 'BUNDLE';
}

class SetupService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
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
   * Get email templates list
   */
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const response = await fetch(`${this.baseUrl}/esend/etemplate`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load email templates: ${response.status}`);
    }

    const data = await response.json();
    return data?.data?.eTemplates || data?.eTemplates || [];
  }

  /**
   * Get custom forms by type
   */
  async getCustomFormsByType(type: string): Promise<CustomForm[]> {
    const response = await fetch(`${this.baseUrl}/rest/customForm?type=${type}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load custom forms: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get all tests/assessments
   */
  async getAllTests(): Promise<Test[]> {
    const params = new URLSearchParams({
      start: '0',
      max: '50',
      search: '',
      sort: 'updatedAt',
      order: 'asc',
    });

    const response = await fetch(`${this.baseUrl}/edtest/quiz?${params.toString()}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load tests: ${response.status}`);
    }

    const data = await response.json();
    return data?.data || [];
  }

  /**
   * Get products list (courses, merchandise, bundles)
   */
  async getProductsList(types: string = 'course,merchandise,pbundle'): Promise<{
    courses: Product[];
    merchandise: Product[];
    bundles: Product[];
  }> {
    const response = await fetch(`${this.baseUrl}/snode/icategory/products?types=${types}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.status}`);
    }

    const products: Product[] = await response.json();
    
    return products.reduce(
      (acc: { courses: Product[]; merchandise: Product[]; bundles: Product[] }, product: Product) => {
        if (product.categoryType === 'SERVICE') {
          acc.courses.push(product);
        } else if (product.categoryType === 'PRODUCT') {
          acc.merchandise.push(product);
        } else if (product.categoryType === 'BUNDLE') {
          acc.bundles.push(product);
        }
        return acc;
      },
      { courses: [], merchandise: [], bundles: [] },
    );
  }
}

export const setupService = new SetupService();
