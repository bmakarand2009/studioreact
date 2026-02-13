import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar,
  Clock,
  MapPin,
  Video,
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
        console.log('Categories API Response:', cats);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]); // Ensure categories is always an array
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

      console.log('Events API Response:', response);

      // Handle response data safely
      const responseData = Array.isArray(response.data) ? response.data : [];
      let filteredEvents = responseData;

      // Filter by category if selected
      if (selectedCategory && filteredEvents.length > 0) {
        filteredEvents = filteredEvents.filter(
          event => event.category?.guId === selectedCategory
        );
      }

      setEvents(filteredEvents);
      setTotalRecords(response.recordsTotal || 0);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.message || 'Failed to load events. Please try again.');
      setEvents([]); // Reset events on error
      setTotalRecords(0);
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
    navigate('/admin/events/add');
  };

  /**
   * Navigate to event details
   */
  const handleEventClick = (eventId: string) => {
    navigate(`/admin/events/edit/${eventId}`);
  };

  /**
   * Get event image URL
   */
  const getEventImage = (event: Event) => {
    return ImageUtils.getEventCardImage(event, cloudName);
  };

  /**
   * Get payment type badge
   */
  const renderPaymentBadge = (event: Event) => {
    const paymentInfo = eventService.getPaymentTypeInfo(event);

    // Only show icon for donation (heart icon)
    const IconComponent = paymentInfo.icon === 'heart' ? Heart : null;

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
              className="bg-gradient-to-r from-primary-500 to-brand-600 hover:from-primary-500 hover:to-brand-700 text-white shadow-lg hover:shadow-xl transition-all"
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
                      ? 'bg-primary-500 text-white shadow-sm'
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
                      ? 'bg-primary-500 text-white shadow-sm'
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
                      ? 'bg-primary-500 text-white shadow-sm'
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
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
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
                className="bg-gradient-to-r from-primary-500 to-brand-600"
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
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors flex items-start">
                    {renderMeetingProviderIcon(event.onlineMeetProviderName)}
                    <span className="flex-1">{event.name}</span>
                  </h3>

                  {/* Date and Time */}
                  <div className="space-y-1 mb-3 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>{eventService.formatEventDate(event.startTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>
                        {eventService.formatEventTime(event.startTime)} - {' '}
                        {eventService.formatEventTime(event.endTime)}
                      </span>
                    </div>
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

