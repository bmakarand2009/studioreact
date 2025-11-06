import { apiService } from './api';
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
    await apiService.patch<void>(`/snode/erule/${guId}/status`, { isPublished });
  },

  /**
   * Get upcoming events (private/admin)
   */
  async getUpcomingEventsPrivate(): Promise<Event[]> {
    const response = await apiService.get<Event[]>('/snode/event');
    return response.data as Event[];
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
   * Get payment type display info
   */
  getPaymentTypeInfo(event: Event): {
    type: 'paid' | 'free' | 'donation' | 'external';
    label: string;
    icon?: string;
    colorClass: string;
  } {
    if (event.isPaidClass) {
      return {
        type: 'paid',
        label: 'Paid',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      };
    }
    if (event.isDonation) {
      return {
        type: 'donation',
        label: 'Donation',
        icon: 'heart',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      };
    }
    if (event.externalSaleUrl) {
      return {
        type: 'external',
        label: 'External',
        colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      };
    }
    // Default to Free if none of the above
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

