import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  Calendar,
  Clock, 
  MapPin,
  Video,
  Loader2,
  DollarSign,
  CheckCircle,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { appLoadService, TenantDetails } from '@/app/core/app-load';
import { APP_CONFIG } from '@/constants';
import { ImageUtils } from '@/utils/imageUtils';
import { eventService } from '@/services/eventService';
import { Event } from '@/types/event';

export default function EventsListPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);

  // Fetch tenant details and events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        
        // Get tenant details
        let tenant = appLoadService.tenantDetails;
        if (!tenant) {
          tenant = await appLoadService.initAppConfig();
        }
        
        if (!tenant) {
          console.error('Failed to load tenant details');
          setIsLoading(false);
          return;
        }

        setTenantDetails(tenant);

        // Fetch events from API using orgGuId
        const orgGuId = tenant.orgGuId || tenant.tenantId;
        const eventList = await eventService.getPublicEvents(orgGuId.toString());
        
        // Process events similar to Angular component
        const processedEvents: Event[] = eventList.map((event: any) => {
          // Process image URL similar to Angular component
          const imagePrefixPath = `https://res.cloudinary.com/${tenant.cloudName}/image/upload/c_thumb,h_200,w_310/`;
          
          if (event.imageUrl && !event.imageUrl.startsWith('https://res.cloudinary.com/')) {
            event.imageUrl = imagePrefixPath + event.imageUrl;
          } else if (!event.imageUrl) {
            // Use default placeholder
            event.imageUrl = 'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';
          }
          
          // Set clsStartTime from startTime (for compatibility)
          if (event.startTime && !event.clsStartTime) {
            event.clsStartTime = event.startTime;
          }
          
          return event;
        });
        
        setEvents(processedEvents);
        setFilteredEvents(processedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Filter events based on search term
  useEffect(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(searchLower) ||
        event.shortDescription?.toLowerCase().includes(searchLower) ||
        event.longDescription?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEvents(filtered);
  }, [searchTerm, events]);

  const handleEventClick = (event: Event) => {
    // Navigate to event detail page using eventUrl if available
    if (event.scheduleList && event.scheduleList.length > 0 && event.scheduleList[0].eventUrl) {
      navigate(`/events/${event.scheduleList[0].eventUrl}`);
    } else if (event.guId) {
      navigate(`/events/${event.guId}`);
    }
  };

  /**
   * Get payment type badge
   */
  const renderPaymentBadge = (event: Event) => {
    const paymentInfo = eventService.getPaymentTypeInfo(event);
    if (!paymentInfo) return null;

    const iconMap: Record<string, React.ComponentType<any>> = {
      'paid': DollarSign,
      'free': CheckCircle,
      'donation': Heart,
      'external': ExternalLink,
    };

    const IconComponent = iconMap[paymentInfo.type];

    return (
      <span className={`inline-flex items-center justify-center h-6 px-2 ${paymentInfo.colorClass} text-xs font-semibold rounded-full`}>
        {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
        {paymentInfo.label}
      </span>
    );
  };

  /**
   * Format event date and time
   */
  const formatEventDateTime = (event: Event) => {
    if (!event.startTime || !event.endTime) return null;
    
    const dateStr = eventService.formatEventDate(event.startTime);
    const startTimeStr = eventService.formatEventTime(event.startTime);
    const endTimeStr = eventService.formatEventTime(event.endTime);
    
    return {
      date: dateStr,
      time: `${startTimeStr} - ${endTimeStr}`,
    };
  };

  /**
   * Get location display text
   */
  const getLocationText = (event: Event): string | null => {
    if (event.location) {
      return event.location;
    }
    if (event.city) {
      const parts: string[] = [event.city];
      if (event.state) parts.push(event.state);
      const zip = event.zip || event.zipCode;
      if (zip) parts.push(zip);
      return parts.join(', ');
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Explore Our Events
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover exciting events and join us for memorable experiences. Find events that interest you.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search criteria.'
                : 'No events are available at the moment.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => {
                const dateTime = formatEventDateTime(event);
                const locationText = getLocationText(event);
                
                return (
                  <div 
                    key={event.guId} 
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer flex flex-col h-full"
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Event Image - Maintain 3:2 aspect ratio */}
                    <div className="relative bg-gradient-to-br from-primary-100 to-brand-100 dark:from-primary-900/30 dark:to-brand-900/30 overflow-hidden" style={{ aspectRatio: '3/2' }}>
                      {/* Placeholder icon - shown when no image or image fails */}
                      <div className="w-full h-full flex items-center justify-center absolute inset-0" style={{ aspectRatio: '3/2' }}>
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      {/* Event image - covers placeholder if loaded successfully */}
                      {event.imageUrl && (
                        <img 
                          src={event.imageUrl} 
                          alt={event.name}
                          className="w-full h-full object-cover relative z-10"
                          style={{ aspectRatio: '3/2' }}
                          onError={(e) => {
                            // Hide image if it fails to load, showing placeholder with gradient
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      {/* Payment Type Badge */}
                      {renderPaymentBadge(event) && (
                        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-semibold text-primary-600 dark:text-primary-400 z-20">
                          {eventService.getPaymentTypeInfo(event)?.label || 'Free'}
                        </div>
                      )}
                    </div>

                    {/* Event Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Tags/Category */}
                      {(event.tagList && event.tagList.length > 0) || event.category?.name ? (
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {event.tagList && event.tagList.slice(0, 2).map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center justify-center min-w-[80px] h-6 px-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {event.category?.name && (!event.tagList || event.tagList.length === 0) && (
                            <span className="inline-flex items-center justify-center min-w-[80px] h-6 px-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                              {event.category.name}
                            </span>
                          )}
                        </div>
                      ) : null}

                      {/* Event Title */}
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {event.name}
                      </h3>

                      {/* Date and Time */}
                      {dateTime && (
                        <div className="flex items-start gap-2 mb-3 text-gray-600 dark:text-gray-300">
                          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{dateTime.date}</div>
                            <div className="text-xs">{dateTime.time}</div>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {locationText && (
                        <div className="flex items-start gap-2 mb-3 text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{locationText}</span>
                        </div>
                      )}

                      {/* Online Meeting Indicator */}
                      {event.isOnlineMeeting && (
                        <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                          <Video className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium">
                            {event.onlineMeetProviderName === 'zoom' ? 'Zoom Meeting' : 
                             event.onlineMeetProviderName === 'googlemeet' ? 'Google Meet' : 
                             'Online Meeting'}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {(event.shortDescription || event.longDescription) && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 overflow-hidden">
                          {event.shortDescription || event.longDescription}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-4">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-brand-600 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-primary-100 mb-6">
            Contact our team to learn more about upcoming events or discuss your event needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="sm" 
              className="px-6 py-2"
              onClick={() => navigate('/contact')}
            >
              Contact Us
            </Button>
            <Button 
              size="sm" 
              className="px-6 py-2 bg-white text-primary-600 hover:bg-gray-100"
              onClick={() => navigate('/login')}
            >
              Sign Up for Updates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
