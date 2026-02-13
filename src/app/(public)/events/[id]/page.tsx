import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import {
  Video,
  Zap,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  Globe,
  Linkedin,
  ImageIcon,
} from "lucide-react";
import { appLoadService } from "@/app/core/app-load";
import { eventService } from "@/services/eventService";
import { Event, EventMembership } from "@/types/event";

const HOST_PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/wajooba/image/upload/v1697785936/master/user-image-placehoder.jpg";
const DEFAULT_EVENT_IMAGE =
  "https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg";
// Map preview image from sample (fallback when no map embed)
const MAP_PREVIEW_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCrTJWlma4Wfv-9Meg_ZzuxJjlBYv7go16lnaBD-_eAphPXvnYb3Gg4KPp2Kck5ASS2JAHqC9F0fval2_TQ_H9ToYFX8yRKwTaDPZvJYMDzyy70CVvdS25Lzke57ncAot6_n6jQYEyJiS5pp3GkoDh8bnNrY5AShEexUY6PJXJcwG3ugM26zl9L4vezusrABGF7FUvG6sNPuVfcd78my71hqwPjcYiqKVdxmh7gbVOMob_gpiVvycZbFLIwtcQOlUb05vcpG2q1O4A";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  /** Same source as footer (wajooba-public-layout): org.footerInfo; kept in state so it's available when event loads. */
  const [tenantDetails, setTenantDetails] = useState<{
    org?: { footerInfo?: string };
  } | null>(null);
  const [thumbnail, setThumbnail] = useState<string>(DEFAULT_EVENT_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImageLightboxOpen, setHeroImageLightboxOpen] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        let tenant = appLoadService.tenantDetails;
        if (!tenant) {
          tenant = await appLoadService.initAppConfig();
        }
        if (!tenant?.orgGuId) {
          setError("Failed to load tenant.");
          return;
        }
        const data = await eventService.getPublicEventByUrl(tenant.orgGuId, id);
        if (!data) {
          setError("Event not found.");
          return;
        }
        setEvent(data);
        setTenantDetails(tenant);

        // Thumbnail: same logic as Angular (cloudinary or full URL)
        if (data.imageUrl) {
          if (data.imageUrl.startsWith("https://res.cloudinary.com/")) {
            setThumbnail(data.imageUrl);
          } else if (tenant.cloudName) {
            setThumbnail(
              `https://res.cloudinary.com/${tenant.cloudName}/image/upload/${data.imageUrl}`,
            );
          }
        } else {
          setThumbnail(DEFAULT_EVENT_IMAGE);
        }
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event.");
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  /** Single source: payment type from eventService (matches v5 logic) */
  const getPaymentType = (e: Event) => eventService.getPaymentTypeInfo(e);

  const getEventPrice = (
    e: Event,
  ): { price: number; currency: string } | null => {
    if (!e.memberships?.length) return null;
    const preferences = ["recurring", "unlimited"];
    for (const pref of preferences) {
      const item = e.memberships.find(
        (m: EventMembership) => m.membershipType === pref,
      );
      if (item)
        return {
          price: item.price,
          currency: (item.currency || "USD").toUpperCase(),
        };
    }
    const first = e.memberships[0];
    return {
      price: first.price,
      currency: (first.currency || "USD").toUpperCase(),
    };
  };

  const getHostDisplay = (e: Event) => {
    if (e.wemail?.displayTitle) return e.wemail.displayTitle;
    if (e.isTeacher && e.teacher?.fullName) return e.teacher.fullName;
    return e.host || "Host";
  };

  const getLocationText = (e: Event) => {
    if (e.location) return e.location;
    if (e.roomName && (e.city || e.state || e.zip)) {
      const parts = [e.roomName, e.city, e.state, e.zip || e.zipCode].filter(
        Boolean,
      );
      return parts.join(", ");
    }
    if (e.city) {
      const parts = [e.city, e.state, e.zip || e.zipCode].filter(Boolean);
      return parts.join(", ");
    }
    return e.isOnlineMeeting ? "Online Event" : null;
  };

  const getMapsSearchUrl = (e: Event) => {
    const loc = [e.roomName, e.location, e.city, e.state, e.zip]
      .filter(Boolean)
      .join(", ");
    return loc
      ? `https://www.google.com/maps/search/${encodeURIComponent(loc)}`
      : null;
  };

  const handleRegister = () => {
    if (!event) return;
    const payment = getPaymentType(event);
    if (payment.type === "external" && event.externalSaleUrl) {
      window.open(event.externalSaleUrl, "_blank");
      return;
    }
    if (payment.type === "free") {
      navigate("/login");
      return;
    }
    if (payment.type === "donation" && event.donationCategory?.guId) {
      navigate(`/donations/${event.donationCategory.guId}`);
      return;
    }
    if (payment.type === "paid" && event.memberships?.[0]) {
      const scheduleParam = event.scheduleId ? "1" : "0";
      navigate(
        `/checkout/event/${event.eventUrl || event.guId}/${event.memberships[0].guId}/${scheduleParam}`,
      );
      return;
    }
  };

  const formatDateRange = (e: Event) => {
    if (!e.startTime || !e.endTime) return null;
    const start = new Date(e.startTime * 1000);
    const end = new Date(e.endTime * 1000);
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", opts)}`;
  };

  const formatScheduleDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatScheduleTime = (startTs: number, endTs: number) => {
    const s = new Date(startTs * 1000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const e = new Date(endTs * 1000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${s} - ${e}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading event...
          </p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {error || "Event not found."}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/events")}
          >
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const paymentType = getPaymentType(event);
  const priceInfo = getEventPrice(event);
  const dateRangeStr = formatDateRange(event);
  const locationDisplay = getLocationText(event);
  const mapsUrl = getMapsSearchUrl(event);
  const scheduleItems = event.classScheduleDates?.length
    ? event.classScheduleDates
    : event.scheduleList;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div>
          {/* Hero – image with gradient overlay, 3:2 aspect ratio (landscape) */}
          <div
            className="relative w-full rounded-2xl overflow-hidden mb-8 sm:mb-12 shadow-lg group"
            style={{ aspectRatio: "3/1" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${thumbnail})` }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
              aria-hidden
            />
            {/* View image button – top right */}
            <button
              type="button"
              onClick={() => setHeroImageLightboxOpen(true)}
              className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-white backdrop-blur-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:top-4 sm:right-4 sm:px-4 sm:py-2.5"
              aria-label="View full image"
            >
              <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs font-semibold sm:text-sm">
                View image
              </span>
            </button>
            <ImageLightbox
              isOpen={heroImageLightboxOpen}
              onClose={() => setHeroImageLightboxOpen(false)}
              imageSrc={thumbnail}
              alt={event.name}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-12">
              <div className="max-w-3xl w-full min-w-0 space-y-3 sm:space-y-6">
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {event.isOnlineMeeting && (
                    <div className="flex h-7 sm:h-8 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-white/20 backdrop-blur-xl px-2.5 sm:px-3 border border-white/30 shadow-lg">
                      <Video className="text-white size-4 shrink-0" />
                      <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        Online Event
                      </span>
                    </div>
                  )}
                  {(event.category?.name ||
                    (event.tagList && event.tagList[0])) && (
                    <div className="flex h-7 sm:h-8 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-primary-600 px-2.5 sm:px-3 shadow-lg ring-1 ring-white/20">
                      <Zap className="text-white size-4 shrink-0" />
                      <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        {event.category?.name || event.tagList?.[0] || "Event"}
                      </span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-lg break-words">
                  {event.name}
                </h1>
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-black/40 hover:bg-black/50 transition-colors backdrop-blur-xl p-1.5 pr-3 sm:pr-5 rounded-full border border-white/20 shadow-xl max-w-full min-w-0">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cover bg-center border border-white/30 shrink-0"
                    style={{
                      backgroundImage: `url(${HOST_PLACEHOLDER_IMAGE})`,
                    }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5">
                      Hosted by
                    </span>
                    <span className="text-white text-xs sm:text-sm font-semibold truncate sm:truncate-none">
                      {getHostDisplay(event)}
                      {event.wemail?.designation &&
                        ` • ${event.wemail.designation}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left column – order-2 on mobile so registration card shows first */}
            <div className="lg:col-span-8 space-y-12 order-2 lg:order-1 min-w-0 flex flex-col">
              {/* Lead + About – typography aligned with About page */}
              <section className="min-w-0">
                {(event.shortDescription || event.longDescription) && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-6 break-words">
                    {event.shortDescription}
                  </p>
                )}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  About the Event
                </h2>
                <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-300">
                    {event.longDescription ||
                      event.shortDescription ||
                      "No description available."}
                  </p>
                </div>
              </section>

              {/* Schedule – card style like About values */}
              {scheduleItems && scheduleItems.length > 0 && (
                <section className="min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    {event.isMultiDayEvent ? "Multi-day Schedule" : "Schedule"}
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-shadow">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {scheduleItems.map(
                        (
                          item: {
                            startTime: number;
                            endTime: number;
                            agenda?: string;
                          },
                          i: number,
                        ) => (
                          <div
                            key={i}
                            className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                              <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg font-bold text-sm shrink-0 uppercase w-fit">
                                {formatScheduleDate(item.startTime)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                  {formatScheduleTime(
                                    item.startTime,
                                    item.endTime,
                                  )}
                                </p>
                                {item.agenda && (
                                  <p className="text-gray-600 dark:text-gray-300 break-words">
                                    {item.agenda}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* About the Organizer – show org.footerInfo (same as footer in layout) when organizer or no wemail description */}
              {(event.wemail?.description ||
                event.wemail?.displayTitle ||
                event.wemail?.designation ||
                event.host ||
                event.teacher ||
                tenantDetails?.org?.footerInfo) && (
                <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-8 rounded-xl shadow-sm min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    About the Organizer
                  </h2>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div
                      className="size-24 rounded-xl bg-cover bg-center shrink-0"
                      style={{
                        backgroundImage: `url(${HOST_PLACEHOLDER_IMAGE})`,
                      }}
                      aria-hidden
                    />
                    <div className="space-y-3 flex-1 min-w-0">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {event.wemail?.displayTitle || getHostDisplay(event)}
                        </h3>
                        {event.wemail?.designation && (
                          <p className="text-primary-600 dark:text-primary-400 text-sm font-medium mt-0.5">
                            {event.wemail.designation}
                          </p>
                        )}
                      </div>
                      {(() => {
                        const orgFooterAbout = tenantDetails?.org?.footerInfo;
                        const aboutText =
                          event.wemail?.description ?? orgFooterAbout;
                        return aboutText ? (
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {aboutText}
                          </p>
                        ) : null;
                      })()}
                      <div className="flex flex-wrap gap-4">
                        <a
                          href="#"
                          className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                          aria-label="Website"
                        >
                          <Globe className="size-5" />
                          <span className="text-sm">Website</span>
                        </a>
                        <a
                          href="#"
                          className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                          aria-label="Twitter"
                        >
                          <LinkIcon className="size-5" />
                          <span className="text-sm">Twitter</span>
                        </a>
                        <a
                          href="#"
                          className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="size-5" />
                          <span className="text-sm">LinkedIn</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right column – sticky below header (header is h-16 = 4rem); z-30 so content stacks under nav z-40 */}
            <div className="lg:col-span-4 order-1 lg:order-2 min-w-0 w-full max-w-full self-stretch flex flex-col">
              <div className="lg:sticky lg:top-20 lg:z-30 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow w-full max-w-full min-w-0">
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                      Registration
                    </p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white break-words">
                        {paymentType.type === "donation"
                          ? "Donation"
                          : paymentType.type === "free"
                            ? "Free"
                            : paymentType.type === "external"
                              ? "External"
                              : priceInfo
                                ? `${priceInfo.currency === "USD" ? "$" : ""}${priceInfo.price}${priceInfo.currency !== "USD" ? ` ${priceInfo.currency}` : ""}`
                                : "—"}
                      </span>
                      {priceInfo && paymentType.type === "paid" && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          per person
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-5 mb-8">
                    {dateRangeStr && (
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                          <Calendar className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            Date & Time
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                            {dateRangeStr}
                          </p>
                        </div>
                      </div>
                    )}
                    {(locationDisplay || event.isOnlineMeeting) && (
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                          <MapPin className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            Location
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {locationDisplay || "Virtual Event"}
                            </span>
                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                              >
                                View Map
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {(event.zoomMeetingUrl || event.onlineMeetJoinUrl) && (
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                          <Video className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            Online Meet
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {event.onlineMeetProviderName === "zoom"
                              ? "Zoom"
                              : event.onlineMeetProviderName === "googlemeet"
                                ? "Google Meet"
                                : "Other"}{" "}
                            Platform
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Show Register/Donate/External for all non-past events (including free); functionality later */}
                  {!event.isPastEvent && (
                    <>
                      <Button
                        size="lg"
                        className="w-full text-lg py-4 rounded-xl"
                        onClick={handleRegister}
                      >
                        {paymentType.type === "donation"
                          ? "Donate"
                          : paymentType.type === "external"
                            ? "Register Externally"
                            : "Register Now"}
                        {paymentType.type === "external" && (
                          <ExternalLink className="ml-2 size-5" />
                        )}
                      </Button>
                      <p className="text-center text-gray-600 dark:text-gray-300 text-sm mt-4 px-4">
                        Registration may include access to recording and
                        resources.
                      </p>
                    </>
                  )}
                </div>

                {/* Map preview – sample image when in-person location; link to directions */}
                {(locationDisplay || mapsUrl) && !event.isOnlineMeeting && (
                  <a
                    href={mapsUrl || "#"}
                    target={mapsUrl ? "_blank" : undefined}
                    rel={mapsUrl ? "noopener noreferrer" : undefined}
                    className="rounded-2xl overflow-hidden h-40 relative group cursor-pointer border border-gray-200 dark:border-gray-700 block w-full hover:shadow-lg transition-shadow"
                    aria-label="Map preview of event location"
                  >
                    <img
                      src={MAP_PREVIEW_IMAGE}
                      alt="Map preview of event location"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 py-2 px-4 rounded-full text-sm font-bold text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700">
                        <MapPin className="size-5 text-primary-600 dark:text-primary-400" />
                        Get Directions
                      </span>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
          {event.template && (
            <div
              className="mt-12 rounded-xl overflow-hidden prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-600 prose-p:dark:text-gray-300 prose-headings:text-gray-900 prose-headings:dark:text-white"
              dangerouslySetInnerHTML={{ __html: event.template }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
