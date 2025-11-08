import { environment } from '@/config/environment';

export interface EventTeacher {
  id: string;
  fullName: string;
  email?: string;
}

export interface EventLocation {
  _id: string;
  roomName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDeleted?: boolean;
}

export interface EventPreference {
  size?: number;
  location?: EventLocation | null;
  defaultEventCategory?: string;
}

export interface MeetingProvider {
  _id: string;
  productName: string;
  userName: string;
  [key: string]: any;
}

export interface EventTemplatePayload {
  guId: string;
  name: string;
  orgId: string;
  url: string;
  unhtml: string;
  unjson: Record<string, any>;
  templateId?: string;
}

export interface EventTemplateResponse {
  guId?: string;
  name?: string;
  unhtml?: string;
  unjson?: Record<string, any>;
  [key: string]: any;
}

export interface EventDetailResponse extends Record<string, any> {
  guId?: string;
  id?: string;
  name?: string;
  scheduleList?: Array<Record<string, any>>;
}

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

class EventDetailService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const nameEQ = 'accessToken=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i += 1) {
      let c = cookies[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  private buildHeaders(extra?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (extra) {
      if (Array.isArray(extra)) {
        extra.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else if (extra instanceof Headers) {
        extra.forEach((value, key) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, extra);
      }
    }

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.buildHeaders(init?.headers),
      credentials: 'include',
      ...init,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`Request failed ${response.status}: ${message}`);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  async getEvent(guId: string): Promise<EventDetailResponse> {
    return this.request<EventDetailResponse>(`/snode/erule/${guId}`);
  }

  async createEvent(payload: Record<string, any>): Promise<any> {
    return this.request<any>(`/snode/erule`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEvent(guId: string, payload: Record<string, any>): Promise<any> {
    return this.request<any>(`/snode/erule/${guId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getTeachers(): Promise<EventTeacher[]> {
    const data = await this.request<any>(`/rest/contact?userType=teacher`);
    const list = data?.data || data?.contactList || data || [];

    return Array.isArray(list)
      ? list.map((teacher: any) => ({
          id: teacher?.guId || teacher?.id,
          fullName:
            teacher?.fullName ||
            teacher?.name ||
            [teacher?.firstName, teacher?.lastName].filter(Boolean).join(' ') ||
            'Teacher',
          email: teacher?.email,
        }))
      : [];
  }

  async getLocations(): Promise<EventLocation[]> {
    const data = await this.request<any>(`/snode/location`);
    const locations = data?.data || data || [];

    return Array.isArray(locations)
      ? locations.map((location: any) => ({
          _id: location?._id || location?.id,
          roomName: location?.roomName || '',
          address: location?.address || '',
          city: location?.city || '',
          state: location?.state || '',
          zipCode: location?.zipCode || location?.zip || '',
          isDeleted: Boolean(location?.isDeleted),
        }))
      : [];
  }

  async createLocation(payload: Partial<EventLocation>): Promise<EventLocation> {
    const data = await this.request<any>(`/snode/location`, {
      method: 'POST',
      body: JSON.stringify({
        roomName: payload.roomName || '',
        address: payload.address || '',
        city: payload.city || '',
        state: payload.state || '',
        zipCode: payload.zipCode || '',
      }),
    });

    const location = data?.data || data;
    return {
      _id: location?._id || location?.id,
      roomName: location?.roomName || payload.roomName || '',
      address: location?.address || payload.address || '',
      city: location?.city || payload.city || '',
      state: location?.state || payload.state || '',
      zipCode: location?.zipCode || location?.zip || payload.zipCode || '',
      isDeleted: Boolean(location?.isDeleted),
    };
  }

  async deleteLocation(locationId: string): Promise<void> {
    await this.request(`/snode/location/${locationId}`, {
      method: 'DELETE',
    });
  }

  async getPreferences(): Promise<EventPreference | null> {
    const data = await this.request<any>(`/snode/spref`);
    const preference = Array.isArray(data) ? data[0] : data?.data?.[0] || data?.data || data;

    if (!preference) {
      return null;
    }

    return {
      size: preference?.size,
      defaultEventCategory: preference?.defaultEventCategory,
      location: preference?.location
        ? {
            _id: preference.location?._id || preference.location?.id || '',
            roomName: preference.location?.roomName || '',
            address: preference.location?.address || '',
            city: preference.location?.city || '',
            state: preference.location?.state || '',
            zipCode: preference.location?.zipCode || preference.location?.zip || '',
            isDeleted: Boolean(preference.location?.isDeleted),
          }
        : null,
    };
  }

  async getMeetingProviders(): Promise<MeetingProvider[]> {
    const data = await this.request<any>(`/authmgr/oauth/providers/omeeting`);
    const providers = Array.isArray(data)
      ? data
      : data && typeof data === 'object'
      ? Object.values(data)
      : [];

    return providers.map((provider: any) => ({
      _id: provider?._id || provider?.id || provider?.accountId || '',
      productName: provider?.productName || provider?.name || '',
      userName: provider?.userName || provider?.accountName || provider?.email || '',
      ...provider,
    }));
  }

  async getEventTemplate(guId: string): Promise<EventTemplateResponse | null> {
    try {
      const data = await this.request<EventTemplateResponse>(`/stemplate/program/${guId}`);
      return data || null;
    } catch (error) {
      // The API returns 404 when template is missing; treat it as null
      console.warn('[EventDetailService] Unable to load template', error);
      return null;
    }
  }

  async saveTemplate(payload: EventTemplatePayload): Promise<any> {
    const endpoint = payload.templateId
      ? `/stemplate/program/${payload.templateId}`
      : `/stemplate/program`;

    return this.request<any>(endpoint, {
      method: payload.templateId ? 'PUT' : 'POST',
      body: JSON.stringify({
        guId: payload.guId,
        name: payload.name,
        orgId: payload.orgId,
        url: payload.url,
        unhtml: payload.unhtml,
        unjson: payload.unjson,
      }),
    });
  }

  async getQrCode(productUri: string): Promise<string | null> {
    try {
      const data = await this.request<any>(`/stemplate/asset/qrcode`, {
        method: 'POST',
        body: JSON.stringify({ productUri }),
      });
      return data?.data || data?.qrCode || null;
    } catch (error) {
      console.warn('[EventDetailService] Unable to fetch QR code', error);
      return null;
    }
  }
}

export const eventDetailService = new EventDetailService();
export default eventDetailService;
