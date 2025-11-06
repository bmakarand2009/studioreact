## **Context**

You are implementing a **production-ready Event List page** for a React-based multi-tenant education platform. You have:

1. **Design Reference**: A beautiful, modern Course List UI in React with Tailwind CSS (`studioreact/src/app/admin/courses/page.tsx`)
2. **Business Logic Reference**: A fully functional Angular event list component with complete API integration (`v5byclasses/myapp/src/app/main/admin/programs/program-list`)
3. **Event Detail Reference**: A comprehensive Angular event add/edit component (`v5byclasses/myapp/src/app/main/admin/programs/program-add-edit`)

## **Objective**

Create a fully functional Event List page for the admin dashboard by implementing:
- Real API integration for event data
- Search and filtering functionality
- Event state filtering (Current/Past/Archived)
- Grid layout view
- Pagination
- Loading states with skeletons
- Error handling
- Image optimization via Cloudinary
- Multi-tenant support
- Event-specific features (location, meeting info, schedule)

---

## **📋 Requirements**

### **1. API Integration**

**Base Configuration:**
```typescript
// Environment: studioreact/src/config/environments/
apiBaseUrl: 'https://api.wajooba.me'
```

**Primary Endpoint:**
```
GET /snode/erule?start={offset}&max={limit}&search={query}&isShowPastEvents={boolean}&isShowArchived={boolean}
```

**Query Parameters:**
- `start` - Pagination offset (default: 0)
- `max` - Page size (default: 50)
- `search` - Search term (default: empty string)
- `isShowPastEvents` - Show past events (optional, only include if true)
- `isShowArchived` - Show archived events (optional, only include if true)

**Expected Response:**
```typescript
{
  c: number;
  draw: number;
  recordsTotal: number;        // Total number of events
  recordsFiltered: number;     // Number of filtered results
  data: Array<{
    guId: string;              // Unique identifier
    id: string;                // Same as guId
    name: string;              // Event name
    shortDescription?: string;  // Brief description
    longDescription?: string;   // Full description
    imageUrl?: string;         // Cloudinary path
    
    // Payment & Display
    isPaidClass: boolean;
    isFreeClass: boolean;
    isDonation: boolean;
    externalSaleUrl?: string;
    isPublished: boolean;
    isFeaturedClass: boolean;
    
    // Schedule Information
    startTime: number;         // Unix timestamp (seconds)
    endTime: number;           // Unix timestamp (seconds)
    startTimeStr?: string;     // Formatted date string
    endTimeStr?: string;       // Formatted date string
    weekDay: string;           // Day of week
    endsAfterWeeks?: string;   // Repeat duration
    clsStartTime?: number;     // Class start time
    
    // Location Information
    roomName?: string;
    location?: string;         // Address
    city?: string;
    state?: string;
    zip?: string;
    zipCode?: string;
    
    // Meeting Information
    isInPersonMeeting: boolean;
    isOnlineMeeting: boolean;
    isMultiDayEvent: boolean;
    onlineMeetJoinUrl?: string;
    onlineMeetAdminUrl?: string;
    onlineMeetPassword?: string;
    onlineMeetProviderName?: string;  // 'zoom' | 'googlemeet'
    meetingProvider?: string;
    
    // Host/Organizer
    host?: string;
    isTeacher: boolean;
    teacher?: {
      guId: string;
      name: string;
      fullName: string;
    };
    
    // Category & Tags
    category: {
      guId: string;
      name: string;
    };
    tagList?: string[];
    
    // Schedule Details
    scheduleList?: Array<{
      scheduleId: string;
      startTime: number;
      endTime: number;
      agenda?: string;
      isFirstClass: boolean;
      eventUrl: string;
    }>;
    
    // Metadata
    dateCreated: number;       // Unix timestamp
    dateUpdated: number;       // Unix timestamp
    tenantId: number;
    tid: string;
    
    // Form & Registration
    registrationFormId?: string;
    maxAttendees?: number;
    
    // Template
    templateId?: string;
    
    // Status Flags
    isDisabled: boolean;
    isDeleted: boolean;
  }>
}
```

### **2. Authentication**

**Headers Required:**
```typescript
{
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json'
}
```

**Token Source:**
- Check existing `authService.ts` or `authStore.ts`
- Token should be stored in localStorage/sessionStorage
- Implement auto-refresh if expired

### **3. Image Handling (Cloudinary)**

**URL Pattern:**
```typescript
// Default placeholder
'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg'

// Optimized image URL for event cards
`https://res.cloudinary.com/${cloudName}/image/upload/h_200,w_310/${imagePath}`

// Different sizes
`https://res.cloudinary.com/${cloudName}/image/upload/c_fill,h_${height},w_${width}/${imagePath}`
```

**Parameters:**
- `cloudName` - From tenant config (via ping API)
- `h_200,w_310` - Height and width for event cards
- `c_fill` - Crop mode (fill, fit, scale)
- `imagePath` - From event.imageUrl

**Important Notes:**
- If `imageUrl` includes 'http', treat as external URL (don't prepend cloudinary)
- Use placeholder for missing images
- Aspect ratio should be 3:2 for event cards

### **4. State Management**

**Required State Variables:**
```typescript
const [events, setEvents] = useState<Event[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [eventState, setEventState] = useState<'current' | 'past' | 'archived'>('current');
const [selectedCategory, setSelectedCategory] = useState('');
const [pageIndex, setPageIndex] = useState(0);
const [pageSize, setPageSize] = useState(50);
const [totalRecords, setTotalRecords] = useState(0);
const [categories, setCategories] = useState<EventCategory[]>([]);
```

### **5. Service Layer**

**Create:** `studioreact/src/services/eventService.ts`

**Required Methods:**
```typescript
// Fetch events with filters
// Endpoint: GET /snode/erule?start={start}&max={max}&search={search}&isShowPastEvents={bool}&isShowArchived={bool}
getEvents(options: {
  start: number;
  max: number;
  search?: string;
  isShowPastEvents: boolean;
  isShowAll: boolean;
}): Promise<EventsResponse>

// Get event details
// Endpoint: GET /snode/erule/{guId}
getEventDetails(guId: string): Promise<Event>

// Get event categories
// Endpoint: GET /snode/icategory/event
getEventCategories(): Promise<EventCategory[]>

// Update event published status
// Endpoint: PATCH /snode/erule/{guId}/status
updateEventStatus(guId: string, isPublished: boolean): Promise<void>

// Get upcoming events (private/admin)
// Endpoint: GET /snode/event
getUpcomingEventsPrivate(): Promise<Event[]>
```

---

## **🎨 Design Preservation**

**Keep from Course List:**
1. ✅ Tailwind CSS classes and styling
2. ✅ Dark mode support (`dark:` classes)
3. ✅ Responsive grid layout (1-2-3-4 columns)
4. ✅ Card-based design with gradients
5. ✅ Icon usage from Lucide React
6. ✅ Typography and spacing
7. ✅ Search bar UI
8. ✅ Button components
9. ✅ Loading skeletons
10. ✅ Empty/error states

**Event-Specific Additions:**
1. ✅ Event state toggle (Current/Past/Archived)
2. ✅ Payment type badges (Paid/Free/Donation/External)
3. ✅ Meeting provider icons (Zoom/Google Meet)
4. ✅ Published status indicator
5. ✅ Time/date display with timezone
6. ✅ Location display
7. ✅ Host/organizer information
8. ✅ Multi-day event indicator
9. ✅ Online/in-person/hybrid badges

---

## **📝 Implementation Steps**

### **Step 1: Create TypeScript Interfaces**

```typescript
// studioreact/src/types/event.ts

export interface Event {
  guId: string;
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  imageUrl?: string;
  
  // Payment & Display
  isPaidClass: boolean;
  isFreeClass: boolean;
  isDonation: boolean;
  externalSaleUrl?: string;
  isPublished: boolean;
  isFeaturedClass: boolean;
  
  // Schedule Information
  startTime: number;         // Unix timestamp in seconds
  endTime: number;           // Unix timestamp in seconds
  startTimeStr?: string;
  endTimeStr?: string;
  weekDay: string;
  endsAfterWeeks?: string;
  clsStartTime?: number;
  
  // Location Information
  roomName?: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  zipCode?: string;
  
  // Meeting Information
  isInPersonMeeting: boolean;
  isOnlineMeeting: boolean;
  isMultiDayEvent: boolean;
  onlineMeetJoinUrl?: string;
  onlineMeetAdminUrl?: string;
  onlineMeetPassword?: string;
  onlineMeetProviderName?: 'zoom' | 'googlemeet' | string;
  meetingProvider?: string;
  
  // Host/Organizer
  host?: string;
  isTeacher: boolean;
  teacher?: {
    guId: string;
    name: string;
    fullName: string;
  };
  
  // Category & Tags
  category: {
    guId: string;
    name: string;
  };
  tagList?: string[];
  
  // Schedule Details
  scheduleList?: EventSchedule[];
  
  // Metadata
  dateCreated: number;
  dateUpdated: number;
  tenantId: number;
  tid: string;
  
  // Form & Registration
  registrationFormId?: string;
  maxAttendees?: number;
  
  // Template
  templateId?: string;
  
  // Status Flags
  isDisabled: boolean;
  isDeleted: boolean;
}

export interface EventSchedule {
  scheduleId: string;
  startTime: number;
  endTime: number;
  agenda?: string;
  isFirstClass: boolean;
  eventUrl: string;
}

export interface EventsResponse {
  c: number;
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Event[];
}

export interface EventCategory {
  guId: string;
  name: string;
  categoryType: string;
}

export interface EventFilters {
  start: number;
  max: number;
  search?: string;
  isShowPastEvents: boolean;
  isShowAll: boolean;
}

export type EventState = 'current' | 'past' | 'archived';
```

### **Step 2: Create Event Service**

```typescript
// studioreact/src/services/eventService.ts

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

    const response = await apiService.get<EventsResponse>(`/snode/erule?${params.toString()}`);
    return response.data as EventsResponse;
  },

  /**
   * Get event details by ID
   */
  async getEventDetails(guId: string): Promise<Event> {
    const response = await apiService.get<Event>(`/snode/erule/${guId}`);
    return response.data as Event;
  },

  /**
   * Get event categories
   */
  async getEventCategories(): Promise<EventCategory[]> {
    const response = await apiService.get<EventCategory[]>('/snode/icategory/event');
    return response.data as EventCategory[];
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
    type: 'paid' | 'free' | 'donation' | 'external' | null;
    label: string;
    icon: string;
    colorClass: string;
  } | null {
    if (event.isPaidClass) {
      return {
        type: 'paid',
        label: 'Paid',
        icon: 'dollar-sign',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      };
    }
    if (event.isFreeClass) {
      return {
        type: 'free',
        label: 'Free',
        icon: 'check-circle',
        colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
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
        icon: 'external-link',
        colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      };
    }
    return null;
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
```

### **Step 3: Update Image Utility**

```typescript
// studioreact/src/utils/imageUtils.ts

export class ImageUtils {
  private static PLACEHOLDER = 
    'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';

  /**
   * Build optimized Cloudinary URL
   */
  static buildCloudinaryUrl(
    cloudName: string,
    imagePath: string | undefined,
    width: number = 480,
    height: number = 320,
    crop: 'fill' | 'fit' | 'scale' = 'fill'
  ): string {
    if (!imagePath || !cloudName) {
      return this.PLACEHOLDER;
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/c_${crop},h_${height},w_${width}/${imagePath}`;
  }

  /**
   * Get event image with fallback
   * Event images use h_200,w_310 sizing
   */
  static getEventCardImage(event: { imageUrl?: string }, cloudName?: string): string {
    if (!event.imageUrl) {
      return this.PLACEHOLDER;
    }

    // If URL already includes http, use as-is (external URL)
    if (event.imageUrl.includes('http')) {
      return event.imageUrl;
    }

    if (cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/h_200,w_310/${event.imageUrl}`;
    }

    return this.PLACEHOLDER;
  }

  /**
   * Get course image with fallback
   */
  static getCourseCardImage(course: { image1?: string }, cloudName?: string): string {
    if (!course.image1) {
      return this.PLACEHOLDER;
    }

    if (cloudName) {
      return this.buildCloudinaryUrl(cloudName, course.image1, 480, 320, 'fill');
    }

    return this.PLACEHOLDER;
  }
}
```

### **Step 4: Create Events Page Component**

```typescript
// studioreact/src/app/admin/events/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar,
  Clock,
  MapPin,
  Video,
  Loader2,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { Button, Pagination } from '@/components/ui';
import { eventService } from '@/services/eventService';
import { Event, EventState } from '@/types/event';
import { ImageUtils } from '@/utils/imageUtils';
import { appLoadService } from '@/app/core/app-load';

export default function EventsListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [eventState, setEventState] = useState<EventState>('current');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Get tenant config for cloudinary
  const [cloudName, setCloudName] = useState<string>('');

  useEffect(() => {
    const loadTenantConfig = async () => {
      const tenantDetails = await appLoadService.initAppConfig();
      if (tenantDetails?.cloudName) {
        setCloudName(tenantDetails.cloudName);
      }
    };
    loadTenantConfig();
  }, []);

  /**
   * Load event categories
   */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await eventService.getEventCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  /**
   * Fetch events from API
   */
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isShowPastEvents = eventState === 'past';
      const isShowAll = eventState === 'archived';

      const response = await eventService.getEvents({
        start: pageIndex * pageSize,
        max: pageSize,
        search: searchQuery || undefined,
        isShowPastEvents,
        isShowAll,
      });

      let filteredEvents = response.data;

      // Filter by category if selected
      if (selectedCategory) {
        filteredEvents = filteredEvents.filter(
          event => event.category?.guId === selectedCategory
        );
      }

      setEvents(filteredEvents);
      setTotalRecords(response.recordsTotal);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.message || 'Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, searchQuery, eventState, selectedCategory]);

  /**
   * Initial load and when filters change
   */
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /**
   * Search with debounce
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageIndex(0); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Reset page when event state or category changes
   */
  useEffect(() => {
    setPageIndex(0);
  }, [eventState, selectedCategory]);

  /**
   * Navigate to add event page
   */
  const handleAddEvent = () => {
    navigate('/admin/events/event');
  };

  /**
   * Navigate to event details
   */
  const handleEventClick = (eventId: string) => {
    navigate(`/admin/events/${eventId}/detail`);
  };

  /**
   * Get event image URL
   */
  const getEventImage = (event: Event) => {
    return ImageUtils.getEventCardImage(event, cloudName);
  };

  /**
   * Toggle event published status
   */
  const handleTogglePublished = async (event: Event, newStatus: boolean) => {
    try {
      await eventService.updateEventStatus(event.guId, newStatus);
      // Update local state
      setEvents(prev => 
        prev.map(e => e.guId === event.guId ? { ...e, isPublished: newStatus } : e)
      );
    } catch (err) {
      console.error('Failed to update event status:', err);
    }
  };

  /**
   * Get payment type badge
   */
  const renderPaymentBadge = (event: Event) => {
    const paymentInfo = eventService.getPaymentTypeInfo(event);
    if (!paymentInfo) return null;

    const IconComponent = {
      'dollar-sign': DollarSign,
      'check-circle': CheckCircle,
      'heart': Heart,
      'external-link': ExternalLink,
    }[paymentInfo.icon];

    return (
      <span className={`inline-flex items-center justify-center h-5 px-2.5 ${paymentInfo.colorClass} text-[10px] font-semibold rounded-full`}>
        {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
        {paymentInfo.label}
      </span>
    );
  };

  /**
   * Get meeting provider icon
   */
  const renderMeetingProviderIcon = (providerName?: string) => {
    if (providerName === 'zoom') {
      return <img src="/assets/images/logos/zoom-icon.svg" alt="Zoom" className="h-4 w-4 mr-1" />;
    }
    if (providerName === 'googlemeet') {
      return <img src="/assets/images/logos/google-meet-icon.svg" alt="Google Meet" className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-brand-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your events and schedules
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddEvent}
              className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Event State Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setEventState('current')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    eventState === 'current'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Current Events"
                >
                  Current
                </button>
                <button
                  onClick={() => setEventState('past')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    eventState === 'past'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Past Events"
                >
                  Past
                </button>
                <button
                  onClick={() => setEventState('archived')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    eventState === 'archived'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Archived Events"
                >
                  Archived
                </button>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.guId} value={category.guId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-1">
                  Error Loading Events
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <Button 
                  onClick={() => fetchEvents()} 
                  variant="secondary" 
                  size="sm" 
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No events found' : 'No events available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or filters' 
                : 'Get started by creating your first event'
              }
            </p>
            {searchQuery ? (
              <Button
                onClick={() => setSearchQuery('')}
                variant="secondary"
                size="sm"
              >
                Clear search
              </Button>
            ) : (
              <Button
                onClick={handleAddEvent}
                className="bg-gradient-to-r from-primary-600 to-brand-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Event
              </Button>
            )}
          </div>
        )}

        {/* Event Grid */}
        {!isLoading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {events.map((event) => (
              <div
                key={event.guId}
                onClick={() => handleEventClick(event.guId)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group flex flex-col"
              >
                {/* Event Image */}
                <div className="relative aspect-[3/2] bg-gradient-to-br from-primary-100 to-brand-100 dark:from-primary-900/30 dark:to-brand-900/30 overflow-hidden">
                  <img
                    src={getEventImage(event)}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = ImageUtils.buildCloudinaryUrl('', '', 480, 320);
                    }}
                  />
                </div>

                {/* Event Content */}
                <div className="p-4 pt-2 flex flex-col flex-grow">
                  {/* Header with Payment Badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap flex-1">
                      {renderPaymentBadge(event)}
                      {event.isFeaturedClass && (
                        <span className="inline-flex items-center justify-center h-5 px-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-semibold rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Title with Meeting Icon */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-start">
                    {renderMeetingProviderIcon(event.onlineMeetProviderName)}
                    <span className="flex-1">{event.name}</span>
                  </h3>

                  {/* Date and Time */}
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3 text-xs">
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>
                      {eventService.formatEventDate(event.startTime)} • {' '}
                      {eventService.formatEventTime(event.startTime)} - {' '}
                      {eventService.formatEventTime(event.endTime)}
                    </span>
                  </div>

                  {/* Meeting Type & Location */}
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    {event.isOnlineMeeting && (
                      <span className="inline-flex items-center text-blue-600 dark:text-blue-400">
                        <Video className="h-3 w-3 mr-1" />
                        Online
                      </span>
                    )}
                    {event.isInPersonMeeting && event.location && (
                      <span className="inline-flex items-center text-green-600 dark:text-green-400">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.city || 'In-Person'}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                    <div className="flex items-center">
                      {event.category?.name && (
                        <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {event.category.name}
                        </span>
                      )}
                    </div>
                    {event.isPublished && (
                      <span className="flex items-center text-green-600 dark:text-green-400 text-[10px] font-medium">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Published
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalRecords > 0 && (
          <Pagination
            currentPage={pageIndex}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={(page) => setPageIndex(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
            isLoading={isLoading}
            pageSizeOptions={[25, 50, 100, 200]}
            showPageSize={true}
          />
        )}
      </div>
    </div>
  );
}
```

---

## **🧪 Testing Checklist**

### **Core Functionality**
- [ ] Events load on page mount
- [ ] Search filters events by name/description
- [ ] Event state toggle works (Current/Past/Archived)
- [ ] Category dropdown filters correctly
- [ ] Images load with Cloudinary URLs
- [ ] Placeholder shown for missing images
- [ ] Loading state displays correctly
- [ ] Empty state shows when no results
- [ ] Error state shows on API failure

### **Event-Specific Features**
- [ ] Payment type badges display correctly (Paid/Free/Donation/External)
- [ ] Meeting provider icons show (Zoom/Google Meet)
- [ ] Published status indicator works
- [ ] Date/time format displays correctly (with timezone)
- [ ] Location information displays when available
- [ ] Online/In-person/Hybrid badges show correctly
- [ ] Featured event badge displays
- [ ] Multi-day event indicator shows
- [ ] Category tags display
- [ ] Host/organizer information shows

### **Pagination**
- [ ] Pagination controls display at bottom
- [ ] Page numbers show correctly
- [ ] Current page is highlighted
- [ ] Navigation buttons work correctly
- [ ] Page size selector works
- [ ] "Showing X to Y of Z results" displays correctly
- [ ] Pagination hides when results fit on one page
- [ ] Mobile shows compact pagination
- [ ] Search resets to page 1
- [ ] Filter changes reset to page 1

### **Layout**
- [ ] Grid layout displays correctly (1-2-3-4 columns)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Cards display properly with all information
- [ ] Hover effects work smoothly

### **UI/UX**
- [ ] Dark mode styles work correctly
- [ ] Hover states work on cards
- [ ] Click navigation to event details works
- [ ] Search debounces properly (500ms)
- [ ] Loading states don't flicker
- [ ] Error messages are clear and actionable
- [ ] Empty states are helpful
- [ ] Icons render correctly
- [ ] Badges are properly colored
- [ ] Transitions are smooth

---

## **✅ Success Criteria**

Your implementation is complete when:

1. ✅ Events load from real API (`/snode/erule`)
2. ✅ Event state filtering works (Current/Past/Archived)
3. ✅ Category filter works
4. ✅ Search filters events by name/description
5. ✅ **Pagination UI displays with all controls**
6. ✅ **Page navigation works correctly**
7. ✅ **Pagination resets on filter changes**
8. ✅ Images display via Cloudinary with proper paths
9. ✅ Payment type badges show correctly (Paid/Free/Donation/External)
10. ✅ Meeting provider icons display (Zoom/Google Meet)
11. ✅ Published status indicator works
12. ✅ Date/time formatting is correct (separate lines with icons)
13. ✅ Location information displays
14. ✅ Meeting type badges show (Online/In-Person)
15. ✅ Loading states show properly
16. ✅ Empty/error states handle edge cases
17. ✅ Design matches course list style
18. ✅ Dark mode works throughout
19. ✅ Mobile responsive grid layout (1-2-3-4 columns)
20. ✅ Navigation to event detail page works
21. ✅ All tests pass

---

## **🔄 Key Differences from Course List**

1. **API Endpoint**: `/snode/erule` vs `/snode/icategory`
2. **State Filtering**: Events have Current/Past/Archived states (courses don't)
3. **Time Display**: Events show start/end times with separate date and time lines (with Calendar and Clock icons)
4. **Location**: Events include location information (city, state, address)
5. **Meeting Types**: Events distinguish between online/in-person/hybrid
6. **Payment Types**: Events use different payment type system (isPaidClass, isDonation, externalSaleUrl)
7. **Meeting Providers**: Events can have Zoom/Google Meet integration
8. **Published Status**: Events have explicit published status indicator
9. **Image Sizing**: Events use h_200,w_310 vs courses use c_fill,h_320,w_480
10. **Image Field**: Events use `imageUrl` vs courses use `image1`

---

## **📚 Additional Resources**

- **API Documentation**: Reference Angular services for exact API contracts
- **Design System**: Use existing Tailwind components from course list
- **Icons**: Lucide React icon library
- **Date Formatting**: Use native JS `Intl.DateTimeFormat` or moment/date-fns
- **State Management**: Consider using React Context or Zustand for complex state

---

## **🚀 Next Steps**

After completing the Event List:

1. Implement Event Details page
2. Implement Event Add/Edit page
3. Add event scheduling features
4. Add attendee management
5. Integrate with calendar view
6. Add export/import functionality
7. Add analytics dashboard
8. Implement email notifications
9. Add QR code generation for events
10. Add social sharing features

