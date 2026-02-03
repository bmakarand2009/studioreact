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
  
  // Category & Tags (API may send category.paymentType: 'FREE' | 'PAID' | 'DONATION' | 'EXTERNAL' | 'PRODUCT')
  category: {
    guId: string;
    name: string;
    paymentType?: string;
  };
  // v5 event detail uses isPaid for free check; list API may send isPaid or isPaidClass
  isPaid?: boolean;
  /** Public list API returns top-level paymentType (or payment_type): 'paidevent' | 'freeevent' | 'donationevent' | 'externalevent' */
  paymentType?: string;
  payment_type?: string;
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
  
  // Template (detail API may return HTML for GrapeJS template)
  templateId?: string;
  template?: string;

  // Detail API / public event by URL – optional fields
  scheduleId?: string;
  eventUrl?: string;
  isPastEvent?: boolean;
  isDisableRegistration?: boolean;
  zoomMeetingUrl?: string;
  memberships?: EventMembership[];
  donationCategory?: { guId: string; name?: string };
  classScheduleDates?: { startTime: number; endTime: number; agenda?: string }[];
  wemail?: {
    authorType?: string;
    displayTitle?: string;
    designation?: string;
    description?: string;
  };

  // Status Flags
  isDisabled: boolean;
  isDeleted: boolean;
}

export interface EventMembership {
  guId: string;
  price: number;
  currency?: string;
  membershipType?: string;
  billingFrequency?: string;
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

