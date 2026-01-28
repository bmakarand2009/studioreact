export interface ProductDetails {
  // Course properties
  courseName?: string;
  longDescription?: string;
  authorName?: string;
  durationText?: string;
  coursePrice?: string;
  authorType?: 'teacher' | 'organization' | 'host' | 'organizer' | 'Event Organizer' | 'Senior Full Stack Developer' | string;
  courseImage?: string;
  registrationLink?: string;
  
  // Event properties
  eventName?: string;
  eventType?: 'hybrid event' | 'in-person event' | 'online event' | 'event' | 'Technology Conference' | string;
  eventDescription?: string;
  eventLocation?: string;
  eventDate?: string;
  eventTime?: string;
  eventHost?: string;
  eventPrice?: string;
  eventImage?: string;

  // Product properties
  productName?: string;
  name?: string;
  shortDescription?: string;
  productType?: string;

  type?: 'course' | 'event' | 'product' | 'merchandise';
}

export interface AISidebarState {
  isOpen: boolean;
  targetField: string | null;
  features: string[];
  isDesignerMode: boolean;
  productDetails?: ProductDetails;
}

export interface AIResultEvent {
  field: string;
  value: string;
  targetField?: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  html?: string;
  htmlContent?: string;
  version?: number;
}

export interface ChatMessageEvent {
  role: 'user' | 'ai';
  text: string;
  html?: string;
  htmlContent?: string;
  version?: number;
}
