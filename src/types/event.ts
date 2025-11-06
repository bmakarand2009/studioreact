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

