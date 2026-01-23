import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCcw,
  Tag,
  Trash2,
  UploadCloud,
  User,
  Wand2,
} from 'lucide-react';

import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import appLoadService, { TenantDetails } from '@/app/core/app-load';
import { ImageUtils } from '@/utils/imageUtils';
import eventDetailService, {
  EventLocation,
  EventPreference,
  EventTeacher,
  MeetingProvider,
} from '@/services/eventDetailService';
import { eventAiService, EventAiContext, EventAiTarget } from '@/services/eventAiService';
import { MediaSliderLauncher } from '@/components/media-slider';
import { eventService } from '@/services/eventService';
import type { EventCategory } from '@/types/event';

import type { EventDetailResponse } from '@/services/eventDetailService';

const PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';

const DEFAULT_TEMPLATE_HTML = `<section style="font-family: 'Inter', system-ui; max-width: 720px; margin: 0 auto; padding: 48px; background: linear-gradient(135deg, #e0f2fe, #ede9fe); border-radius: 24px;">
  <h1 style="font-size: 36px; margin-bottom: 16px; color: #0f172a;">Your Event Headline</h1>
  <p style="font-size: 18px; color: #475569; line-height: 1.6;">
    Use this area to highlight the most compelling reasons to attend. Share the experience, the transformation, and the value participants will gain.
  </p>
  <ul style="margin-top: 24px; color: #334155; font-size: 16px;">
    <li>✔️ Expert-led sessions and interactive segments</li>
    <li>✔️ Welcoming community with collaborative activities</li>
    <li>✔️ Resources, templates, and follow-up guidance</li>
  </ul>
</section>`;

type Step = 0 | 1;

type MeetingMode = 'inperson' | 'online' | 'both';

interface ScheduleFormRow {
  id?: string;
  dispDate: string;
  startTime: string;
  endTime: string;
  agenda: string;
  isDelete?: boolean;
}

interface EventFormState {
  name: string;
  shortDescription: string;
  longDescription: string;
  image1: string;

  // Author / host
  authorType: 'host' | 'organizer';
  host: string;
  organizerName: string;
  teacherId: string;
  isTeacher: boolean;

  // Meeting
  isInPersonMeeting: boolean;
  isOnlineMeeting: boolean;
  isAutoGenerateMeetingLink: boolean;
  meetingProvider: string;
  onlineMeetJoinUrl: string;
  onlineMeetAdminUrl: string;
  onlineMeetPassword: string;

  // Location
  locationId: string;
  roomName: string;
  location: string;
  city: string;
  state: string;
  zipCode: string;

  // Event meta
  isMultiDayEvent: boolean;
  maxAttendees: string;
  eventTags: string[];
  categoryGuId: string;
  isFeaturedClass: boolean;
}

interface TemplateState {
  html: string;
  json: Record<string, any>;
  templateId?: string;
}

const emptyScheduleRow = (): ScheduleFormRow => {
  const now = new Date();
  const roundedStart = new Date(now.getTime());
  roundedStart.setMinutes(0, 0, 0);
  const roundedEnd = new Date(roundedStart.getTime());
  roundedEnd.setHours(roundedEnd.getHours() + 1);

  return {
    dispDate: toDateInputValue(roundedStart),
    startTime: toTimeInputValue(roundedStart),
    endTime: toTimeInputValue(roundedEnd),
    agenda: '',
    isDelete: false,
  };
};

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateTimeToUnix = (dateInput: string, timeInput: string): number => {
  if (!dateInput || !timeInput) {
    return 0;
  }
  const [year, month, day] = dateInput.split('-').map(Number);
  const [hour, minute] = timeInput.split(':').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

const hydrateScheduleRow = (schedule: Record<string, any>): ScheduleFormRow => {
  const start = new Date((schedule?.startTime || schedule?.dt || 0) * 1000);
  const end = new Date((schedule?.endTime || schedule?.ed || 0) * 1000);

  return {
    id: schedule?.scheduleId || schedule?.id,
    dispDate: toDateInputValue(start),
    startTime: toTimeInputValue(start),
    endTime: toTimeInputValue(end),
    agenda: schedule?.agenda || '',
    isDelete: false,
  };
};

const initialFormState: EventFormState = {
  name: '',
  shortDescription: '',
  longDescription: '',
  image1: '',
  authorType: 'host',
  host: '',
  organizerName: '',
  teacherId: '',
  isTeacher: false,
  isInPersonMeeting: true,
  isOnlineMeeting: false,
  isAutoGenerateMeetingLink: true,
  meetingProvider: '',
  onlineMeetJoinUrl: '',
  onlineMeetAdminUrl: '',
  onlineMeetPassword: '',
  locationId: '',
  roomName: '',
  location: '',
  city: '',
  state: '',
  zipCode: '',
  isMultiDayEvent: false,
  maxAttendees: '75',
  eventTags: [],
  categoryGuId: '',
  isFeaturedClass: true, // Default to true for events (matches Angular behavior)
};

const sparkleStyles = `
@keyframes sparkle-burst {
  0%, 100% {
    transform: scale(0.5);
    opacity: 0;
  }
  45% {
    transform: scale(1);
    opacity: 1;
  }
  70% {
    transform: scale(0.8);
    opacity: 0.6;
  }
}

.sparkle-star {
  position: absolute;
  width: 8px;
  height: 8px;
  opacity: 0;
}

.sparkle-star polygon {
  fill: currentColor;
}`;

const AddEditEventPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeStep, setActiveStep] = useState<Step>(0);
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [formState, setFormState] = useState<EventFormState>(initialFormState);
  const [schedules, setSchedules] = useState<ScheduleFormRow[]>([emptyScheduleRow()]);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [teachers, setTeachers] = useState<EventTeacher[]>([]);
  const [meetingProviders, setMeetingProviders] = useState<MeetingProvider[]>([]);
  const [preferences, setPreferences] = useState<EventPreference | null>(null);
  const [eventData, setEventData] = useState<EventDetailResponse | null>(null);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState<boolean>(false);
  const [templateState, setTemplateState] = useState<TemplateState>({
    html: DEFAULT_TEMPLATE_HTML,
    json: {},
    templateId: undefined,
  });
  const [templateJsonText, setTemplateJsonText] = useState<string>(JSON.stringify({}, null, 2));
  const [qrImage, setQrImage] = useState<string | null>(null);

  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTemplateSaving, setIsTemplateSaving] = useState<boolean>(false);
  const [aiLoadingField, setAiLoadingField] = useState<EventAiTarget | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pollingSession, setPollingSession] = useState<{ id: string; attempts: number } | null>(null);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'event-detail-sparkle-keyframes';
    styleEl.innerHTML = sparkleStyles;
    document.head.appendChild(styleEl);
    return () => {
      if (styleEl.parentElement) {
        styleEl.parentElement.removeChild(styleEl);
      }
    };
  }, []);

  const eventId = useMemo(() => {
    if (!id || id === 'add' || id === 'new') {
      return null;
    }
    return id;
  }, [id]);

  const isExistingEvent = Boolean(eventId || eventData?.guId || eventData?.id);

  const primaryEventId = useMemo(() => {
    return (
      (eventData?.id as string | undefined) ||
      (eventData?.guId as string | undefined) ||
      eventId ||
      null
    );
  }, [eventData, eventId]);

  const tenantOrgId = tenantDetails?.orgId;

  const eventImageUrl = useMemo(() => {
    if (!formState.image1) {
      return PLACEHOLDER_IMAGE;
    }

    if (formState.image1.startsWith('http')) {
      return formState.image1;
    }

    if (tenantDetails?.cloudName) {
      return ImageUtils.buildCloudinaryUrl(
        tenantDetails.cloudName,
        formState.image1,
        480,
        320,
        'fill',
      );
    }

    return PLACEHOLDER_IMAGE;
  }, [formState.image1, tenantDetails]);

  const eventAiContext = useMemo<EventAiContext>(() => {
    const firstSchedule = schedules.find((row) => !row.isDelete);
    const eventDate = firstSchedule ? new Date(firstSchedule.dispDate) : null;
    const start = firstSchedule ? combineDateTimeToUnix(firstSchedule.dispDate, firstSchedule.startTime) : 0;
    const end = firstSchedule ? combineDateTimeToUnix(firstSchedule.dispDate, firstSchedule.endTime) : 0;

    const formattedDate = eventDate ? eventDate.toLocaleDateString() : 'TBD';
    const formattedStart = start ? new Date(start * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'TBD';
    const formattedEnd = end ? new Date(end * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'TBD';

    return {
      eventName: formState.name || 'Event',
      shortDescription: formState.shortDescription || '',
      longDescription: formState.longDescription || '',
      authorName:
        formState.authorType === 'organizer'
          ? formState.organizerName || 'Organizer'
          : formState.host || tenantDetails?.name || 'Host',
      eventType: formState.isInPersonMeeting && formState.isOnlineMeeting
        ? 'Hybrid Event'
        : formState.isOnlineMeeting
        ? 'Online Event'
        : 'In-Person Event',
      eventLocation:
        formState.isOnlineMeeting && !formState.isInPersonMeeting
          ? 'Online session'
          : [formState.roomName, formState.location, formState.city, formState.state]
              .filter(Boolean)
              .join(', ') ||
            'Location to be announced',
      eventDate: formattedDate,
      eventTime: `${formattedStart} - ${formattedEnd}`,
      eventPrice: Number(formState.maxAttendees) > 0 ? 'Paid or RSVP required' : 'Free',
    };
  }, [formState, schedules, tenantDetails]);

  const hydrateLocations = useCallback(
    (locationList: EventLocation[], preferredLocation?: EventLocation | null) => {
      setLocations(locationList);

      const firstActiveLocation = locationList.find((loc) => !loc.isDeleted);
      const defaultLocation = preferredLocation || preferences?.location || firstActiveLocation;

      if (defaultLocation && !formState.locationId) {
        setFormState((prev) => ({
          ...prev,
          locationId: defaultLocation?._id || '',
          roomName: defaultLocation?.roomName || '',
          location: defaultLocation?.address || '',
          city: defaultLocation?.city || '',
          state: defaultLocation?.state || '',
          zipCode: defaultLocation?.zipCode || '',
        }));
      }
    },
    [formState.locationId, preferences?.location],
  );

  const hydrateEvent = useCallback(
    async (event: EventDetailResponse, providerFallback?: MeetingProvider[]) => {
      setEventData(event);

      const currentTags = Array.isArray(event?.tagList) ? [...event.tagList] : [];
      const isOrganizer = Boolean(event?.isTeacher);
      const meetingProviderId = event?.meetingProvider || formState.meetingProvider || providerFallback?.[0]?._id || '';

      setFormState((prev) => ({
        ...prev,
        name: event?.name || '',
        shortDescription: event?.shortDescription || '',
        longDescription: event?.longDescription || '',
        image1: event?.imageUrl || '',
        authorType: isOrganizer ? 'organizer' : 'host',
        host: event?.host || tenantDetails?.name || prev.host,
        organizerName: event?.teacher?.fullName || event?.teacher?.name || '',
        teacherId: event?.teacher?.guId || event?.teacher?.id || '',
        isTeacher: isOrganizer,
        isInPersonMeeting: event?.isInPersonMeeting ?? true,
        isOnlineMeeting: event?.isOnlineMeeting ?? false,
        isAutoGenerateMeetingLink: Boolean(event?.meetingProvider),
        meetingProvider: meetingProviderId,
        onlineMeetJoinUrl: event?.onlineMeetJoinUrl || '',
        onlineMeetAdminUrl: event?.onlineMeetAdminUrl || '',
        onlineMeetPassword: event?.onlineMeetPassword || '',
        locationId: event?.locationId || '',
        roomName: event?.roomName || '',
        location: event?.location || '',
        city: event?.city || '',
        state: event?.state || '',
        zipCode: event?.zipCode || event?.zip || '',
        isMultiDayEvent: event?.isMultiDayEvent ?? false,
        maxAttendees: event?.maxAttendees ? String(event.maxAttendees) : prev.maxAttendees,
        eventTags: currentTags,
        categoryGuId: event?.category?.guId || prev.categoryGuId || '',
        isFeaturedClass: event?.isFeaturedClass ?? true,
      }));

      if (Array.isArray(event?.scheduleList) && event.scheduleList.length > 0) {
        const hydrated = event.scheduleList.map(hydrateScheduleRow);
        setSchedules(hydrated);
      }

      if (event?.scheduleList?.[0]?.eventUrl) {
        const qr = await eventDetailService.getQrCode(`events/${event.scheduleList[0].eventUrl}`);
        if (qr) {
          setQrImage(qr);
        }
      }
    },
    [formState.meetingProvider, tenantDetails?.name],
  );

  const loadTemplate = useCallback(async (eventIdForTemplate: string) => {
    if (!eventIdForTemplate) {
      return;
    }
    const template = await eventDetailService.getEventTemplate(eventIdForTemplate);
    if (template) {
      setTemplateState({
        html: template?.unhtml || DEFAULT_TEMPLATE_HTML,
        json: template?.unjson || {},
        templateId: template?.guId || template?.id || template?.templateId,
      });
      setTemplateJsonText(
        JSON.stringify(template?.unjson || {}, null, 2),
      );
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsPageLoading(true);
    try {
      const tenant = await appLoadService.initAppConfig();
      setTenantDetails(tenant);

      const [pref, teacherList, locationList, providers, categoryList] = await Promise.all([
        eventDetailService.getPreferences().catch(() => null),
        eventDetailService.getTeachers().catch(() => []),
        eventDetailService.getLocations().catch(() => []),
        eventDetailService.getMeetingProviders().catch(() => []),
        eventService.getEventCategories().catch(() => []),
      ]);

      setPreferences(pref);
      setTeachers(teacherList);
      setMeetingProviders(providers);
      setCategories(categoryList);

      // Set default category from preferences if available
      if (pref?.defaultEventCategory && !formState.categoryGuId) {
        setFormState((prev) => ({ ...prev, categoryGuId: pref.defaultEventCategory || '' }));
      } else if (categoryList.length > 0 && !formState.categoryGuId) {
        // Fallback to first category if no default
        setFormState((prev) => ({ ...prev, categoryGuId: categoryList[0].guId }));
      }

      if (pref?.size) {
        setFormState((prev) => ({ ...prev, maxAttendees: String(pref.size) }));
      }

      if (pref?.location) {
        setFormState((prev) => ({
          ...prev,
          locationId: pref.location?._id || '',
          roomName: pref.location?.roomName || prev.roomName,
          location: pref.location?.address || prev.location,
          city: pref.location?.city || prev.city,
          state: pref.location?.state || prev.state,
          zipCode: pref.location?.zipCode || prev.zipCode,
        }));
      }

      hydrateLocations(locationList, pref?.location || null);

      if (providers.length && !formState.meetingProvider) {
        setFormState((prev) => ({ ...prev, meetingProvider: providers[0]._id }));
      }

      if (eventId) {
        const event = await eventDetailService.getEvent(eventId);
        await hydrateEvent(event, providers);
        const eventGuid = event?.id ?? event?.guId;
        if (eventGuid) {
          await loadTemplate(eventGuid);
        }
      } else {
        // New event defaults
        setFormState((prev) => ({
          ...prev,
          host: tenant?.name || prev.host,
        }));
      }
    } catch (error: any) {
      console.error('[EventAddEdit] Failed to initialize', error);
      toast.error(error?.message || 'Failed to load event details');
    } finally {
      setIsPageLoading(false);
    }
  }, [eventId, hydrateEvent, hydrateLocations, loadTemplate, toast, formState.meetingProvider]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    return () => {
      eventAiService.clearSessions();
    };
  }, []);

  useEffect(() => {
    if (!pollingSession) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await eventAiService.checkFlyerStatus(pollingSession.id);
        if (cancelled) {
          return;
        }
        if (status.status === 'completed' && status.result) {
          setTemplateState((prev) => ({ ...prev, html: status.result || prev.html }));
          toast.success('AI flyer generated successfully');
          setPollingSession(null);
          setIsTemplateSaving(false);
        } else if (status.status === 'failed') {
          toast.error('AI flyer generation failed. Please try again.');
          setPollingSession(null);
          setIsTemplateSaving(false);
        } else if (pollingSession.attempts >= 12) {
          toast.error('AI flyer generation timed out. Please try again later.');
          setPollingSession(null);
          setIsTemplateSaving(false);
        } else {
          setPollingSession({ id: pollingSession.id, attempts: pollingSession.attempts + 1 });
        }
      } catch (error) {
        console.error('[EventAddEdit] Flyer polling failed', error);
        if (pollingSession.attempts >= 12) {
          toast.error('Unable to generate flyer at this time.');
          setPollingSession(null);
          setIsTemplateSaving(false);
        } else {
          setPollingSession({ id: pollingSession.id, attempts: pollingSession.attempts + 1 });
        }
      }
    };

    const timeout = setTimeout(poll, pollingSession.attempts === 0 ? 0 : 5000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [pollingSession, toast]);

  const handleBackToList = useCallback(() => {
    navigate('/admin/events');
  }, [navigate]);

  const updateFormState = useCallback(
    (patch: Partial<EventFormState>) => {
      setFormState((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleImageSelect = useCallback(
    (publicId: string) => {
      // Directly use the public ID received from media slider (matches Angular pattern)
      updateFormState({ image1: publicId });
    },
    [updateFormState],
  );

  const handleMeetingMode = useCallback(
    (mode: MeetingMode) => {
      switch (mode) {
        case 'inperson':
          updateFormState({ isInPersonMeeting: true, isOnlineMeeting: false });
          break;
        case 'online':
          updateFormState({ isInPersonMeeting: false, isOnlineMeeting: true });
          break;
        case 'both':
          updateFormState({ isInPersonMeeting: true, isOnlineMeeting: true });
          break;
        default:
          break;
      }
    },
    [updateFormState],
  );

  const handleScheduleChange = useCallback(
    (index: number, patch: Partial<ScheduleFormRow>) => {
      setSchedules((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      });
    },
    [],
  );

  const addScheduleRow = useCallback(() => {
    setSchedules((prev) => [...prev, emptyScheduleRow()]);
  }, []);

  const removeScheduleRow = useCallback((index: number) => {
    setSchedules((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const handleTagAdd = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || formState.eventTags.includes(trimmed)) {
        return;
      }
      updateFormState({ eventTags: [...formState.eventTags, trimmed] });
    },
    [formState.eventTags, updateFormState],
  );

  const handleTagRemove = useCallback(
    (tag: string) => {
      updateFormState({
        eventTags: formState.eventTags.filter((existing) => existing !== tag),
      });
    },
    [formState.eventTags, updateFormState],
  );

  const runAiGeneration = useCallback(
    async (field: EventAiTarget) => {
      setAiLoadingField(field);
      try {
        const result = await eventAiService.generateField(field, eventAiContext);
        if (field === 'name') {
          updateFormState({ name: result });
        } else if (field === 'shortDescription') {
          updateFormState({ shortDescription: result });
        } else if (field === 'longDescription') {
          updateFormState({ longDescription: result });
        }
        toast.success('AI suggestion applied');
      } catch (error) {
        console.error('[EventAddEdit] AI generation failed', error);
        toast.error('Unable to generate content with AI right now.');
      } finally {
        setAiLoadingField(null);
      }
    },
    [eventAiContext, toast, updateFormState],
  );

  const validateStepOne = useCallback(() => {
    const validationErrors: Record<string, string> = {};

    if (!formState.name.trim()) {
      validationErrors.name = 'Event name is required.';
    }
    if (!formState.shortDescription.trim()) {
      validationErrors.shortDescription = 'Short description is required.';
    }

    const activeSchedules = schedules.filter((row) => !row.isDelete);
    if (!activeSchedules.length) {
      validationErrors.schedules = 'At least one schedule entry is required.';
    } else {
      activeSchedules.forEach((schedule, index) => {
        if (!schedule.dispDate) {
          validationErrors[`schedule-${index}-date`] = 'Date is required.';
        }
        if (!schedule.startTime) {
          validationErrors[`schedule-${index}-start`] = 'Start time is required.';
        }
        if (!schedule.endTime) {
          validationErrors[`schedule-${index}-end`] = 'End time is required.';
        }
      });
    }

    if (formState.authorType === 'host' && !formState.host.trim()) {
      validationErrors.host = 'Host name is required.';
    }

    if (formState.authorType === 'organizer' && !formState.teacherId) {
      validationErrors.teacherId = 'Please select an organizer.';
    }

    if (formState.isInPersonMeeting) {
      if (!formState.location.trim()) {
        validationErrors.location = 'Location address is required for in-person events.';
      }
      if (!formState.city.trim()) {
        validationErrors.city = 'City is required.';
      }
      if (!formState.state.trim()) {
        validationErrors.state = 'State is required.';
      }
      if (!formState.zipCode.trim()) {
        validationErrors.zipCode = 'Zip code is required.';
      }
    }

    if (formState.isOnlineMeeting && !formState.isAutoGenerateMeetingLink && !formState.onlineMeetJoinUrl.trim()) {
      validationErrors.onlineMeetJoinUrl = 'Participant URL is required when not auto-generating the meeting link.';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formState, schedules]);

  const buildEventPayload = useCallback(() => {
    const filteredSchedules = schedules.filter((row) => !row.isDelete);

    const scheduleList = filteredSchedules
      .map((row) => ({
        startTime: combineDateTimeToUnix(row.dispDate, row.startTime),
        endTime: combineDateTimeToUnix(row.dispDate, row.endTime),
        agenda: row.agenda,
        scheduleId: row.id,
        isDelete: false,
      }))
      .sort((a, b) => a.startTime - b.startTime)
      .map((row, index) => ({
        ...row,
        isFirstClass: index === 0,
      }));

    return {
      name: formState.name,
      shortDescription: formState.shortDescription || '',
      longDescription: formState.longDescription || '',
      imageUrl: formState.image1,
      isInPersonMeeting: formState.isInPersonMeeting,
      isOnlineMeeting: formState.isOnlineMeeting,
      isMultiDayEvent: formState.isMultiDayEvent,
      isFeaturedClass: formState.isFeaturedClass,
      host: formState.authorType === 'host' ? formState.host : undefined,
      isTeacher: formState.authorType === 'organizer',
      teacherId: formState.authorType === 'organizer' ? formState.teacherId : undefined,
      organizerName: formState.authorType === 'organizer' ? formState.organizerName : undefined,
      maxAttendees: Number(formState.maxAttendees) || undefined,
      locationId: formState.locationId || undefined,
      roomName: formState.isInPersonMeeting ? formState.roomName : undefined,
      location: formState.isInPersonMeeting ? formState.location : undefined,
      city: formState.isInPersonMeeting ? formState.city : undefined,
      state: formState.isInPersonMeeting ? formState.state : undefined,
      zipCode: formState.isInPersonMeeting ? formState.zipCode : undefined,
      scheduleList,
      tagList: formState.eventTags,
      category: formState.categoryGuId
        ? {
            guId: formState.categoryGuId,
          }
        : preferences?.defaultEventCategory
        ? {
            guId: preferences.defaultEventCategory,
          }
        : undefined,
      meetingProvider: formState.isOnlineMeeting && formState.isAutoGenerateMeetingLink ? formState.meetingProvider : undefined,
      onlineMeetJoinUrl:
        formState.isOnlineMeeting && !formState.isAutoGenerateMeetingLink
          ? formState.onlineMeetJoinUrl
          : undefined,
      onlineMeetAdminUrl:
        formState.isOnlineMeeting && !formState.isAutoGenerateMeetingLink
          ? formState.onlineMeetAdminUrl
          : undefined,
      onlineMeetPassword:
        formState.isOnlineMeeting && !formState.isAutoGenerateMeetingLink
          ? formState.onlineMeetPassword
          : undefined,
    };
  }, [formState, schedules]);

  const handleSaveStepOne = useCallback(async () => {
    if (!validateStepOne()) {
      toast.error('Please resolve the highlighted errors before continuing.');
      return;
    }

    if (!formState.longDescription.trim() && formState.shortDescription.trim()) {
      try {
        setAiLoadingField('longDescription');
        const generated = await eventAiService.generateField('longDescription', eventAiContext);
        updateFormState({ longDescription: generated });
        toast.success('Long description generated successfully');
      } catch (error) {
        console.warn('[EventAddEdit] Unable to auto-generate long description', error);
      } finally {
        setAiLoadingField(null);
      }
    }

    setIsSaving(true);
    try {
      const payload = buildEventPayload();
      let response;
      if (primaryEventId) {
        response = await eventDetailService.updateEvent(primaryEventId, payload);
      } else {
        response = await eventDetailService.createEvent(payload);
      }

      const saved = response?.data || response;
      if (saved) {
        await hydrateEvent(saved, meetingProviders);
        if (!primaryEventId && (saved?.id || saved?.guId)) {
          const newId = saved?.id || saved?.guId;
          navigate(`/admin/events/edit/${newId}`, { replace: true });
        }
        toast.success('Event details saved successfully.');
        setActiveStep(1);
      }
    } catch (error: any) {
      console.error('[EventAddEdit] Failed to save event', error);
      toast.error(error?.message || 'Failed to save event details.');
    } finally {
      setIsSaving(false);
    }
  }, [buildEventPayload, eventAiContext, hydrateEvent, meetingProviders, navigate, primaryEventId, preferences, toast, updateFormState, validateStepOne]);

  const handleTemplateSave = useCallback(
    async (redirectAfterSave: boolean) => {
      if (!primaryEventId) {
        toast.error('Save the event details before updating the template.');
        return;
      }

      let parsedJson: Record<string, any> = templateState.json;
      try {
        parsedJson = JSON.parse(templateJsonText || '{}');
      } catch (error) {
        toast.error('Template JSON is invalid. Please fix it before saving.');
        return;
      }

      if (!tenantOrgId) {
        toast.error('Tenant configuration is required before saving templates.');
        return;
      }

      setIsTemplateSaving(true);
      try {
        const result = await eventDetailService.saveTemplate({
          guId: primaryEventId,
          name: formState.name || eventData?.name || 'Event',
          orgId: tenantOrgId,
          url: eventData?.scheduleList?.[0]?.eventUrl || '',
          unhtml: templateState.html,
          unjson: parsedJson,
          templateId: templateState.templateId,
        });

        const savedTemplate = result?.data || result;
        setTemplateState({
          html: templateState.html,
          json: parsedJson,
          templateId: savedTemplate?.guId || savedTemplate?._id || templateState.templateId,
        });
        toast.success('Template saved successfully.');
        if (redirectAfterSave) {
          navigate('/admin/events');
        }
      } catch (error: any) {
        console.error('[EventAddEdit] Failed to save template', error);
        toast.error(error?.message || 'Failed to save template.');
      } finally {
        setIsTemplateSaving(false);
      }
    },
    [eventData, formState.name, navigate, primaryEventId, templateJsonText, templateState.html, templateState.templateId, tenantOrgId, toast],
  );

  const handleRegenerateTemplate = useCallback(async () => {
    if (!primaryEventId) {
      toast.error('Save the event before generating a template.');
      return;
    }

    try {
      setIsTemplateSaving(true);
      const sessionId = await eventAiService.requestFlyerGeneration(eventAiContext);
      setPollingSession({ id: sessionId, attempts: 0 });
      toast.info('Generating AI flyer...');
    } catch (error) {
      console.error('[EventAddEdit] Unable to request flyer generation', error);
      toast.error('Failed to start AI template generation.');
      setIsTemplateSaving(false);
    }
  }, [eventAiContext, primaryEventId, toast]);

  const handleLocationSelect = useCallback(
    (locationId: string) => {
      const selected = locations.find((loc) => loc._id === locationId);
      if (!selected) {
        updateFormState({ locationId });
        return;
      }
      updateFormState({
        locationId: selected._id,
        roomName: selected.roomName,
        location: selected.address,
        city: selected.city,
        state: selected.state,
        zipCode: selected.zipCode,
      });
    },
    [locations, updateFormState],
  );

  const handleLocationSave = useCallback(async () => {
    try {
      const created = await eventDetailService.createLocation({
        roomName: formState.roomName,
        address: formState.location,
        city: formState.city,
        state: formState.state,
        zipCode: formState.zipCode,
        _id: '',
      });
      const refreshedLocations = await eventDetailService.getLocations();
      setLocations(refreshedLocations);
      updateFormState({ locationId: created._id || '' });
      toast.success('Location saved for future use.');
    } catch (error: any) {
      console.error('[EventAddEdit] Failed to save location', error);
      toast.error(error?.message || 'Failed to save location.');
    }
  }, [formState.city, formState.location, formState.roomName, formState.state, formState.zipCode, toast, updateFormState]);

  const handleLocationDelete = useCallback(async () => {
    if (!formState.locationId) {
      toast.error('Select a location to delete.');
      return;
    }
    try {
      await eventDetailService.deleteLocation(formState.locationId);
      const refreshedLocations = await eventDetailService.getLocations();
      setLocations(refreshedLocations);
      updateFormState({ locationId: '', roomName: '', location: '', city: '', state: '', zipCode: '' });
      toast.success('Location deleted.');
    } catch (error: any) {
      console.error('[EventAddEdit] Failed to delete location', error);
      toast.error(error?.message || 'Failed to delete location.');
    }
  }, [formState.locationId, toast, updateFormState]);

  const handleRegenerateMeetingUrl = useCallback(async () => {
    if (!primaryEventId) {
      toast.error('Event must be saved before regenerating meeting URL.');
      return;
    }

    if (!formState.isOnlineMeeting) {
      toast.error('Event must have online meeting enabled.');
      return;
    }

    if (!formState.isAutoGenerateMeetingLink || !formState.meetingProvider) {
      toast.error('Auto-generate meeting link must be enabled with a provider selected.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        isOnlineMeeting: true,
        meetingProvider: formState.meetingProvider,
      };

      const result = await eventDetailService.regenerateMeetingUrl(primaryEventId, payload);
      const updated = result?.data || result;

      if (updated) {
        await hydrateEvent(updated, meetingProviders);
        toast.success('Meeting URL regenerated successfully.');
      }
    } catch (error: any) {
      console.error('[EventAddEdit] Failed to regenerate meeting URL', error);
      toast.error(error?.message || 'Failed to regenerate meeting URL.');
    } finally {
      setIsSaving(false);
    }
  }, [primaryEventId, formState.isOnlineMeeting, formState.isAutoGenerateMeetingLink, formState.meetingProvider, hydrateEvent, meetingProviders, toast]);

  const renderScheduleRow = (row: ScheduleFormRow, index: number) => {
    const dateError = errors[`schedule-${index}-date`];
    const startError = errors[`schedule-${index}-start`];
    const endError = errors[`schedule-${index}-end`];

    return (
      <div
        key={`schedule-${index}-${row.id || 'new'}`}
        className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Date</label>
            <input
              type="date"
              value={row.dispDate}
              onChange={(event) => handleScheduleChange(index, { dispDate: event.target.value })}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                dateError ? 'border-red-400 focus:ring-red-200' : ''
              }`}
            />
            {dateError && <p className="mt-1 text-xs font-medium text-red-500">{dateError}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Start time</label>
              <input
                type="time"
                value={row.startTime}
                onChange={(event) => handleScheduleChange(index, { startTime: event.target.value })}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                  startError ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {startError && <p className="mt-1 text-xs font-medium text-red-500">{startError}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">End time</label>
              <input
                type="time"
                value={row.endTime}
                onChange={(event) => handleScheduleChange(index, { endTime: event.target.value })}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                  endError ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {endError && <p className="mt-1 text-xs font-medium text-red-500">{endError}</p>}
            </div>
          </div>
        </div>

        {formState.isMultiDayEvent && (
          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Agenda (optional)</label>
            <input
              type="text"
              value={row.agenda}
              onChange={(event) => handleScheduleChange(index, { agenda: event.target.value })}
              placeholder="Session agenda or focus"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          {schedules.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
              onClick={() => removeScheduleRow(index)}
            >
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
          {index === schedules.length - 1 && (
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
              onClick={addScheduleRow}
            >
              <PlusCircle className="h-4 w-4" /> Add slot
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              onClick={handleBackToList}
              aria-label="Back to events"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isExistingEvent ? 'Edit Event' : 'Create Event'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Manage the basics and sales page for your event.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                activeStep === 0
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}
            >
              {activeStep === 0 ? 'Step 1 of 2 · Event Basics' : 'Step 2 of 2 · Sales Page'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-6xl px-6 lg:px-10">
        {activeStep === 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Event name</label>
                    <button
                      type="button"
                      className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-primary-300 disabled:cursor-not-allowed"
                      onClick={() => runAiGeneration('name')}
                      disabled={aiLoadingField === 'name'}
                      aria-label="Generate event name with AI"
                    >
                      {aiLoadingField === 'name' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="relative flex items-center justify-center">
                          <Wand2 className="h-4 w-4 drop-shadow-sm" />
                          <svg
                            className="sparkle-star"
                            style={{ top: '-14px', right: '-2px', animation: 'sparkle-burst 2.2s ease-in-out infinite' }}
                            viewBox="0 0 10 10"
                          >
                            <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                          </svg>
                          <svg
                            className="sparkle-star"
                            style={{ bottom: '-14px', left: '-2px', animation: 'sparkle-burst 2.5s ease-in-out infinite 0.8s' }}
                            viewBox="0 0 10 10"
                          >
                            <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(event) => updateFormState({ name: event.target.value })}
                      placeholder="Enter event name"
                      className={`w-full rounded-lg border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 ${
                        errors.name ? 'border-red-400 focus:ring-red-200' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Short description</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Keep it under 255 characters.</p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-primary-300 disabled:cursor-not-allowed"
                      onClick={() => runAiGeneration('shortDescription')}
                      disabled={aiLoadingField === 'shortDescription'}
                      aria-label="Generate short description with AI"
                    >
                      {aiLoadingField === 'shortDescription' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="relative flex items-center justify-center">
                          <Wand2 className="h-4 w-4 drop-shadow-sm" />
                          <svg
                            className="sparkle-star"
                            style={{ top: '-14px', left: '-2px', animation: 'sparkle-burst 2.1s ease-in-out infinite 0.3s' }}
                            viewBox="0 0 10 10"
                          >
                            <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                          </svg>
                          <svg
                            className="sparkle-star"
                            style={{ bottom: '-14px', right: '-2px', animation: 'sparkle-burst 2.6s ease-in-out infinite 1s' }}
                            viewBox="0 0 10 10"
                          >
                            <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <textarea
                      value={formState.shortDescription}
                      onChange={(event) => updateFormState({ shortDescription: event.target.value })}
                      rows={4}
                      placeholder="Describe your event in a short, compelling way."
                      className="w-full rounded-lg border-0 bg-transparent px-4 py-3 text-sm text-slate-900 focus:ring-0 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className={formState.shortDescription.length > 255 ? 'text-red-500' : ''}>
                      {formState.shortDescription.length}/255 characters
                    </span>
                    {errors.shortDescription && (
                      <span className="font-medium text-red-500">{errors.shortDescription}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Long description</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tell the full story of your event.</p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-primary-300 disabled:cursor-not-allowed"
                      onClick={() => runAiGeneration('longDescription')}
                      disabled={aiLoadingField === 'longDescription'}
                      aria-label="Generate long description with AI"
                    >
                      {aiLoadingField === 'longDescription' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="relative flex items-center justify-center">
                          <Wand2 className="h-4 w-4 drop-shadow-sm" />
                          <svg
                            className="sparkle-star"
                            style={{ top: '-14px', right: '-2px', animation: 'sparkle-burst 2.7s ease-in-out infinite' }}
                            viewBox="0 0 10 10"
                          >
                            <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                          </svg>
                          <svg
                            className="sparkle-star"
                            style={{ bottom: '-14px', left: '-2px', animation: 'sparkle-burst 2.9s ease-in-out infinite 0.7s' }}
                            viewBox="0 0 10 10"
                          >
                            <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <textarea
                      value={formState.longDescription}
                      onChange={(event) => updateFormState({ longDescription: event.target.value })}
                      rows={8}
                      placeholder="Share what participants will experience and why they should attend."
                      className="w-full border-0 bg-transparent text-sm text-slate-900 focus:ring-0 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Event schedule</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Add one or more time slots for this event.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="multi-day-toggle"
                        type="checkbox"
                        checked={formState.isMultiDayEvent}
                        onChange={(event) => updateFormState({ isMultiDayEvent: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="multi-day-toggle" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Multi Slot Event
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {schedules.map((row, index) => renderScheduleRow(row, index))}
                  </div>
                  {errors.schedules && <p className="mt-3 text-xs font-medium text-red-500">{errors.schedules}</p>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Meeting mode</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Choose how participants can join.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        formState.isInPersonMeeting && !formState.isOnlineMeeting
                          ? 'border-primary-300 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-300'
                      }`}
                      onClick={() => handleMeetingMode('inperson')}
                    >
                      <MapPin className="h-4 w-4" /> In-person
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        !formState.isInPersonMeeting && formState.isOnlineMeeting
                          ? 'border-primary-300 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-300'
                      }`}
                      onClick={() => handleMeetingMode('online')}
                    >
                      <Clock className="h-4 w-4" /> Online
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        formState.isInPersonMeeting && formState.isOnlineMeeting
                          ? 'border-primary-300 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-300'
                      }`}
                      onClick={() => handleMeetingMode('both')}
                    >
                      <Calendar className="h-4 w-4" /> Hybrid
                    </button>
                  </div>

                  {formState.isInPersonMeeting && (
                    <div className="mt-6 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Saved locations</label>
                          <select
                            value={formState.locationId}
                            onChange={(event) => handleLocationSelect(event.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            <option value="">Custom location</option>
                            {locations
                              .filter((loc) => !loc.isDeleted)
                              .map((location) => (
                                <option key={location._id} value={location._id}>
                                  {[location.roomName, location.address, location.city]
                                    .filter(Boolean)
                                    .join(', ')}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="flex items-end justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            onClick={handleLocationSave}
                          >
                            Save location
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300"
                            onClick={handleLocationDelete}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Room name</label>
                          <input
                            type="text"
                            value={formState.roomName}
                            onChange={(event) => updateFormState({ roomName: event.target.value })}
                            placeholder="Studio A"
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Address</label>
                          <input
                            type="text"
                            value={formState.location}
                            onChange={(event) => updateFormState({ location: event.target.value })}
                            placeholder="123 Main Street"
                            className={`mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                              errors.location ? 'border-red-400 focus:ring-red-200' : ''
                            }`}
                          />
                          {errors.location && <p className="mt-1 text-xs font-medium text-red-500">{errors.location}</p>}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">City</label>
                          <input
                            type="text"
                            value={formState.city}
                            onChange={(event) => updateFormState({ city: event.target.value })}
                            placeholder="San Francisco"
                            className={`mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                              errors.city ? 'border-red-400 focus:ring-red-200' : ''
                            }`}
                          />
                          {errors.city && <p className="mt-1 text-xs font-medium text-red-500">{errors.city}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">State</label>
                          <input
                            type="text"
                            value={formState.state}
                            onChange={(event) => updateFormState({ state: event.target.value })}
                            placeholder="CA"
                            className={`mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                              errors.state ? 'border-red-400 focus:ring-red-200' : ''
                            }`}
                          />
                          {errors.state && <p className="mt-1 text-xs font-medium text-red-500">{errors.state}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Zip code</label>
                          <input
                            type="text"
                            value={formState.zipCode}
                            onChange={(event) => updateFormState({ zipCode: event.target.value })}
                            placeholder="94105"
                            className={`mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                              errors.zipCode ? 'border-red-400 focus:ring-red-200' : ''
                            }`}
                          />
                          {errors.zipCode && <p className="mt-1 text-xs font-medium text-red-500">{errors.zipCode}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {formState.isOnlineMeeting && isExistingEvent && formState.isAutoGenerateMeetingLink && eventData?.onlineMeetJoinUrl && (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {eventData?.onlineMeetProviderName === 'zoom' && (
                            <img src="/assets/images/logos/zoom-icon.svg" alt="Zoom" className="h-5 w-auto" />
                          )}
                          {eventData?.onlineMeetProviderName === 'googlemeet' && (
                            <img src="/assets/images/logos/google-meet-icon.svg" alt="Google Meet" className="h-5 w-auto" />
                          )}
                          <a
                            href={eventData.onlineMeetJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 underline dark:text-primary-400"
                          >
                            {eventData.onlineMeetJoinUrl}
                          </a>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                          onClick={handleRegenerateMeetingUrl}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Regenerate'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {formState.isOnlineMeeting && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Meeting link options</label>
                        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                              type="radio"
                              checked={formState.isAutoGenerateMeetingLink}
                              onChange={() => updateFormState({ isAutoGenerateMeetingLink: true })}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            Auto-generate link
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                              type="radio"
                              checked={!formState.isAutoGenerateMeetingLink}
                              onChange={() => updateFormState({ isAutoGenerateMeetingLink: false })}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            Enter link manually
                          </label>
                        </div>
                      </div>

                      {formState.isAutoGenerateMeetingLink && (
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Meeting provider</label>
                          <select
                            value={formState.meetingProvider}
                            onChange={(event) => updateFormState({ meetingProvider: event.target.value })}
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            {meetingProviders.length === 0 && (
                              <option value="">Connect a meeting provider to generate links</option>
                            )}
                            {meetingProviders.map((provider) => (
                              <option key={provider._id} value={provider._id}>
                                {provider.userName} ({provider.productName === 'zoom' ? 'Zoom' : provider.productName})
                              </option>
                            ))}
                          </select>
                          {meetingProviders.length === 0 && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Zoom or Google Meet is not connected. Visit Integrations to connect a meeting provider.
                            </p>
                          )}
                        </div>
                      )}

                      {!formState.isAutoGenerateMeetingLink && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Participant URL</label>
                            <input
                              type="url"
                              value={formState.onlineMeetJoinUrl}
                              onChange={(event) => updateFormState({ onlineMeetJoinUrl: event.target.value })}
                              placeholder="https://meet.google.com/..."
                              className={`mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                                errors.onlineMeetJoinUrl ? 'border-red-400 focus:ring-red-200' : ''
                              }`}
                            />
                            {errors.onlineMeetJoinUrl && (
                              <p className="mt-1 text-xs font-medium text-red-500">{errors.onlineMeetJoinUrl}</p>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Host URL (optional)</label>
                            <input
                              type="url"
                              value={formState.onlineMeetAdminUrl}
                              onChange={(event) => updateFormState({ onlineMeetAdminUrl: event.target.value })}
                              placeholder="https://meet.google.com/..."
                              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Meeting password (optional)</label>
                            <input
                              type="text"
                              value={formState.onlineMeetPassword}
                              onChange={(event) => updateFormState({ onlineMeetPassword: event.target.value })}
                              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Event host</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select who is presenting this event.</p>
                  <div className="mt-4 inline-flex rounded-full bg-white p-1 shadow-inner dark:bg-slate-900">
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        formState.authorType === 'host'
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
                      }`}
                      onClick={() => updateFormState({ authorType: 'host', isTeacher: false })}
                    >
                      Organization host
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        formState.authorType === 'organizer'
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
                      }`}
                      onClick={() => updateFormState({ authorType: 'organizer', isTeacher: true })}
                    >
                      Teacher organizer
                    </button>
                  </div>

                  {formState.authorType === 'host' && (
                    <div className="mt-4">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Host name</label>
                      <input
                        type="text"
                        value={formState.host}
                        onChange={(event) => updateFormState({ host: event.target.value })}
                        placeholder="e.g., Wajooba Studio"
                        className={`mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                          errors.host ? 'border-red-400 focus:ring-red-200' : ''
                        }`}
                      />
                      {errors.host && <p className="mt-1 text-xs font-medium text-red-500">{errors.host}</p>}
                    </div>
                  )}

                  {formState.authorType === 'organizer' && (
                    <div className="mt-4 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Select teacher</label>
                      <select
                        value={formState.teacherId}
                        onChange={(event) => {
                          const selected = teachers.find((teacher) => teacher.id === event.target.value);
                          updateFormState({
                            teacherId: event.target.value,
                            organizerName: selected?.fullName || '',
                          });
                        }}
                        className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                          errors.teacherId ? 'border-red-400 focus:ring-red-200' : ''
                        }`}
                      >
                        <option value="">Select a teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
                          </option>
                        ))}
                      </select>
                      {errors.teacherId && <p className="text-xs font-medium text-red-500">{errors.teacherId}</p>}
                    </div>
                  )}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Max attendees</label>
                      <input
                        type="number"
                        min={0}
                        value={formState.maxAttendees}
                        onChange={(event) => updateFormState({ maxAttendees: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Event category</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select a category for this event.</p>
                  <select
                    value={formState.categoryGuId}
                    onChange={(event) => updateFormState({ categoryGuId: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.guId} value={category.guId}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Featured event</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Feature this event prominently on your site.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={formState.isFeaturedClass}
                        onChange={(event) => updateFormState({ isFeaturedClass: event.target.checked })}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:bg-slate-700 dark:peer-focus:ring-primary-800"></div>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Event tags</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add keywords to help categorize this event.</p>
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {formState.eventTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        >
                          <Tag className="h-3 w-3" /> {tag}
                          <button
                            type="button"
                            className="text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-100"
                            onClick={() => handleTagRemove(tag)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add tag and press Enter"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleTagAdd((event.target as HTMLInputElement).value);
                          (event.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <aside className="space-y-8">
                <div className="rounded-3xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <img
                      src={eventImageUrl}
                      alt="Event banner"
                      className="h-48 w-full rounded-2xl object-cover"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent p-4">
                      <p className="text-sm font-semibold text-white">Event Banner</p>
                      <p className="text-xs text-slate-200">Recommended ratio 3:2</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <MediaSliderLauncher
                      variant="secondary"
                      className="flex-1 justify-center rounded-xl bg-white text-slate-600 shadow-sm hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      onSelect={handleImageSelect}
                      title="Select Event Banner"
                      description="Choose an image from your media library or upload a new one"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Change Image
                    </MediaSliderLauncher>
                  </div>
                </div>

                {qrImage && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Event QR code</p>
                    <img src={`data:image/png;base64,${qrImage}`} alt="Event QR" className="mx-auto mt-4 h-40 w-40 object-contain" />
                  </div>
                )}
              </aside>
            </div>

            <div className="mt-10 flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
              <Button
                variant="secondary"
                className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={handleBackToList}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                onClick={handleSaveStepOne}
                disabled={isSaving || aiLoadingField !== null}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </div>
          </section>
        )}

        {activeStep === 1 && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sales Page</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Template Editor</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Customize the event landing page HTML and metadata. Designer integration is coming soon.</p>
                </div>
                <Button
                  variant="secondary"
                  className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
                  onClick={handleRegenerateTemplate}
                  disabled={isTemplateSaving}
                >
                  {isTemplateSaving && pollingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Regenerate AI Template
                </Button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Template HTML</label>
                  <textarea
                    value={templateState.html}
                    onChange={(event) => setTemplateState((prev) => ({ ...prev, html: event.target.value }))}
                    rows={18}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs leading-6 text-slate-700 shadow-inner focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Template metadata (JSON)</label>
                  <textarea
                    value={templateJsonText}
                    onChange={(event) => setTemplateJsonText(event.target.value)}
                    rows={10}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs leading-6 text-slate-700 shadow-inner focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
              <Button
                variant="secondary"
                className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setActiveStep(0)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl border border-primary-200 bg-primary-50 px-6 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
                onClick={() => handleTemplateSave(false)}
                disabled={isTemplateSaving}
              >
                {isTemplateSaving && !pollingSession ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </Button>
              <Button
                className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                onClick={() => handleTemplateSave(true)}
                disabled={isTemplateSaving}
              >
                {isTemplateSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                  </span>
                ) : (
                  'Save & Exit'
                )}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AddEditEventPage;
