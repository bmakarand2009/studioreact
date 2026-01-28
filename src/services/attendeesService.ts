import { environment } from '@/config/environment';

export interface Attendee {
  guId: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  courseBatch?: {
    guId: string;
    name: string;
  };
  membership?: {
    _id: string;
    itemName: string;
    itemPrice: number;
    currency: string;
    startDate: number;
    endDate: number;
    subscription?: {
      subscriptionAmount: number;
      frequency: string;
      timesBilled: number;
      noOfBillingCycles: number;
      remainingBillingCyles?: number;
    };
  };
  progress?: number;
}

export interface AttendeesResponse {
  data: Attendee[];
  count?: number;
  recordsTotal?: number;
}

class AttendeesService {
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
   * Get attendees for a product (course/service/event)
   * @param productId Course/Service/Event ID
   * @param productType 'course' | 'service' | 'event'
   * @param start Page offset (0-based)
   * @param pageSize Number of items per page
   * @param searchText Search query
   * @param batchId Optional batch ID to filter by
   */
  async getAttendees(
    productId: string,
    productType: string,
    start: number = 0,
    pageSize: number = 50,
    searchText: string = '',
    batchId?: string | null
  ): Promise<AttendeesResponse> {
    let apiUrl = `${this.baseUrl}/snode/product/attendee?productId=${productId}&productType=${productType}&start=${start}&max=${pageSize}&search=${searchText}`;
    
    if (batchId) {
      apiUrl += `&batchId=${batchId}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to load attendees: ${response.status}`);
    }

    const result = await response.json();
    return {
      data: result.data || [],
      count: result.count || result.recordsTotal || 0,
      recordsTotal: result.recordsTotal || result.count || 0,
    };
  }

  /**
   * Add an attendee to a product
   */
  async addAttendee(payload: {
    productId: string;
    productType: string;
    contactId: string;
    productName: string;
    courseBatchId?: string | null;
  }): Promise<Attendee> {
    const response = await fetch(`${this.baseUrl}/snode/product/attendee`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to add attendee: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete an attendee from a product
   */
  async deleteAttendee(
    contactId: string,
    productId: string,
    productType: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/snode/product/attendee/${contactId}?productId=${productId}&productType=${productType}`,
      {
        method: 'DELETE',
        headers: this.buildHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to delete attendee: ${response.status}`);
    }
  }

  /**
   * Update attendee's batch
   */
  async updateAttendeeBatch(
    courseId: string,
    attendeeId: string,
    payload: { courseBatchId: string }
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/rest/itemCategory/${courseId}/attendee/${attendeeId}`,
      {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to update attendee batch: ${response.status}`);
    }

    return response.json();
  }
}

export const attendeesService = new AttendeesService();
