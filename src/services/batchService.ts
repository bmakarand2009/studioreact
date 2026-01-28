import { environment } from '@/config/environment';

export interface Batch {
  guId: string;
  name: string;
  isActive?: boolean;
  isDynamic?: boolean;
}

class BatchService {
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
   * Get all batches
   * @param batchId Optional batch ID to get a specific batch
   */
  async getBatches(batchId: string | null = null): Promise<Batch[]> {
    const url = batchId
      ? `${this.baseUrl}/rest/courseBatch/${batchId}`
      : `${this.baseUrl}/rest/courseBatch`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load batches: ${response.status}`);
    }

    const data = await response.json();
    // Handle both array and single object responses
    if (Array.isArray(data)) {
      return data;
    }
    return [data];
  }

  /**
   * Create a new batch
   */
  async createBatch(payload: { name: string; isActive?: boolean }): Promise<Batch> {
    const response = await fetch(`${this.baseUrl}/rest/courseBatch`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        name: payload.name,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to create batch: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update a batch
   */
  async updateBatch(batchId: string, payload: { name: string }): Promise<Batch> {
    const response = await fetch(`${this.baseUrl}/rest/courseBatch/${batchId}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to update batch: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete a batch
   */
  async deleteBatch(batchId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rest/courseBatch/${batchId}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to delete batch: ${response.status}`);
    }
  }

  /**
   * Update the item's (course/service/product bundle) current batch
   * Works for any itemCategory (courses, services, product bundles)
   */
  async updateCourseBatch(itemId: string, payload: { name: string; courseBatchId: string }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/rest/itemCategory/${itemId}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to update item batch: ${response.status}`);
    }

    return response.json();
  }
}

export const batchService = new BatchService();
