import { apiService } from './api';
import { authService } from './authService';
import { Event, EventsResponse, EventFilters, EventCategory } from '@/types/event';

export const eventService = {
  /**
   * Fetch events with filtering and pagination
   */
  async getEvents(filters: EventFilters): Promise<EventsResponse> {
    const params = new URLSearchParams({
      start: filters.start.toString(),
      max: filters.max.toString(),
      search: filters.search || '',
    });

    if (filters.isShowPastEvents) {
      params.append('isShowPastEvents', 'true');
    }

    if (filters.isShowAll) {
      params.append('isShowArchived', 'true');
    }

    try {
      const response = await apiService.get<EventsResponse>(`/snode/erule?${params.toString()}`);
      console.log('Raw API response:', response);
      
      // Handle different response structures
      // Case 1: Response is ApiResponse<EventsResponse> - access response.data
      // Case 2: Response is directly EventsResponse
      // Case 3: Response is wrapped differently
      
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        // ApiResponse wrapper with EventsResponse inside
        return response.data as EventsResponse;
      } else if (Array.isArray(response)) {
        // Direct array response (unexpected but handle it)
        return {
          data: response,
          recordsTotal: response.length,
          recordsFiltered: response.length,
          c: 0,
          draw: 0,
        };
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Response has data field directly
        return response as unknown as EventsResponse;
      } else {
        // Fallback - return empty structure
        return {
          data: [],
          recordsTotal: 0,
          recordsFiltered: 0,
          c: 0,
          draw: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  /**
   * Get event details by ID
   */
  async getEventDetails(guId: string): Promise<Event> {
    const response = await apiService.get<Event>(`/snode/erule/${guId}`);
    // Handle ApiResponse wrapper or direct response
    return (response.data || response) as Event;
  },

  /**
   * Get event categories
   */
  async getEventCategories(): Promise<EventCategory[]> {
    const response = await apiService.get<EventCategory[]>('/snode/icategory/event');
    console.log('Raw categories response:', response);
    // Handle ApiResponse wrapper or direct response
    if (response.data && Array.isArray(response.data)) {
      return response.data as EventCategory[];
    } else if (Array.isArray(response)) {
      return response as EventCategory[];
    } else {
      return [];
    }
  },

  /**
   * Update event published status
   */
  async updateEventStatus(guId: string, isPublished: boolean): Promise<void> {
    await apiService.put<void>(`/snode/erule/${guId}/status`, { isPublished });
  },

  /**
   * Get upcoming events (private/admin)
   */
  async getUpcomingEventsPrivate(): Promise<Event[]> {
    const response = await apiService.get<Event[]>('/snode/event');
    return response.data as Event[];
  },

  /**
   * Get public event detail by event URL slug (e.g. one-start-21600807).
   * API expects URL slug after tenant id, not guId.
   * Endpoint: GET /snode/pevent/{orgId}/{eventUrl}
   */
  async getPublicEventByUrl(orgId: string, eventUrl: string): Promise<Event | null> {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.wajooba.me';
      const headers: Record<string, string> = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      };
      const token = authService.accessToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBaseUrl}/snode/pevent/${orgId}/${eventUrl}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch event: ${response.status}`);
      }

      const result = await response.json();
      return (result?.data ?? result) as Event;
    } catch (error) {
      console.error('Error fetching public event:', error);
      throw error;
    }
  },

  /**
   * Get public events list (no auth required)
   * Endpoint: GET /snode/pevent/{orgId}
   * Returns: { data: Event[] } or Event[]
   */
  async getPublicEvents(orgId: string): Promise<Event[]> {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.wajooba.me';
      const response = await fetch(`${apiBaseUrl}/snode/pevent/${orgId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different response structures
      // Angular component expects result.data, so check for that first
      if (result && result.data && Array.isArray(result.data)) {
        return result.data as Event[];
      } else if (Array.isArray(result)) {
        return result as Event[];
      } else {
        console.warn('Unexpected response structure from /snode/pevent:', result);
        return [];
      }
    } catch (error) {
      console.error('Error fetching public events:', error);
      throw error;
    }
  },

  /**
   * Build optimized Cloudinary URL for event image
   */
  buildEventImageUrl(imageUrl: string | undefined, cloudName: string): string {
    if (!imageUrl) {
      return 'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';
    }

    // If URL already includes http, use as-is (external URL)
    if (imageUrl.includes('http')) {
      return imageUrl;
    }

    // Build Cloudinary URL
    return `https://res.cloudinary.com/${cloudName}/image/upload/h_200,w_310/${imageUrl}`;
  },

  /**
   * Format Unix timestamp to readable date
   */
  formatEventDate(timestamp: number): string {
    // Timestamp is in seconds, convert to milliseconds
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  /**
   * Format Unix timestamp to readable time
   */
  formatEventTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  },

  /**
   * Get payment type display info.
   * Single source of truth – matches v5 event detail logic (donation → external → paid → free).
   * List API may send category.paymentType or isPaid; detail API has memberships.
   */
  getPaymentTypeInfo(event: Event): {
    type: 'paid' | 'free' | 'donation' | 'external';
    label: string;
    icon?: string;
    colorClass: string;
  } {
    // Public list API returns top-level paymentType (or payment_type): 'paidevent' | 'freeevent' | 'donationevent' | 'externalevent'
    const listPaymentType = (event.paymentType || event.payment_type || '').toLowerCase();
    if (listPaymentType === 'donationevent') {
      return {
        type: 'donation',
        label: 'Donation',
        icon: 'heart',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      };
    }
    if (listPaymentType === 'externalevent') {
      return {
        type: 'external',
        label: 'External',
        colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      };
    }
    if (listPaymentType === 'paidevent') {
      return {
        type: 'paid',
        label: 'Paid',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      };
    }
    if (listPaymentType === 'freeevent') {
      return {
        type: 'free',
        label: 'Free',
        colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      };
    }

    const paymentType = event.category?.paymentType?.toUpperCase?.();

    // 1. Donation (v5: donationCategory)
    if (event.donationCategory || event.isDonation || paymentType === 'DONATION') {
      return {
        type: 'donation',
        label: 'Donation',
        icon: 'heart',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      };
    }

    // 2. External (v5: externalSaleUrl)
    if (event.externalSaleUrl || paymentType === 'EXTERNAL') {
      return {
        type: 'external',
        label: 'External',
        colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      };
    }

    // 3. Paid (v5: memberships.length > 0; list API may use isPaidClass, isPaid, or category.paymentType)
    const isPaid =
      (event.memberships && event.memberships.length > 0) ||
      event.isPaidClass === true ||
      event.isPaid === true ||
      paymentType === 'PAID' ||
      paymentType === 'PRODUCT';
    if (isPaid) {
      return {
        type: 'paid',
        label: 'Paid',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      };
    }

    // 4. Free (v5: !isPaid && !donationCategory)
    return {
      type: 'free',
      label: 'Free',
      colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    };
  },

  /**
   * Get meeting type display info
   */
  getMeetingTypeInfo(event: Event): {
    type: 'hybrid' | 'online' | 'in-person';
    label: string;
    icon: string;
  } {
    if (event.isInPersonMeeting && event.isOnlineMeeting) {
      return { type: 'hybrid', label: 'Hybrid', icon: 'globe' };
    }
    if (event.isOnlineMeeting) {
      return { type: 'online', label: 'Online', icon: 'video' };
    }
    return { type: 'in-person', label: 'In-Person', icon: 'map-pin' };
  },
};

