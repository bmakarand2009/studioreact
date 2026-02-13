import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import {
  BookOpen,
  Loader2,
  ExternalLink,
  ImageIcon,
  ChevronRight,
  Globe,
  Link as LinkIcon,
  Linkedin,
} from 'lucide-react';
import { appLoadService } from '@/app/core/app-load';
import { courseService } from '@/services/courseService';
import { ImageUtils } from '@/utils/imageUtils';

const AUTHOR_PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/wajooba/image/upload/v1697785936/master/user-image-placehoder.jpg';
const DEFAULT_COURSE_IMAGE = 'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';

type CourseDetailData = Awaited<ReturnType<typeof courseService.getPublicCourseDetail>>['data'];

function getPaymentType(course: CourseDetailData): { type: 'free' | 'paid' | 'donation' | 'external' } {
  const t = (course?.paymentType || '').toUpperCase();
  if (t === 'FREE') return { type: 'free' };
  if (t === 'DONATION') return { type: 'donation' };
  if (t === 'EXTERNAL') return { type: 'external' };
  return { type: 'paid' };
}

function getCoursePrice(course: CourseDetailData): { price: number; currency: string; type?: string; frequency?: string } | null {
  const memberships = course?.memberships;
  if (!memberships?.length) return null;
  const preferences = ['recurring', 'card', 'unlimited'];
  for (const pref of preferences) {
    const item = memberships.find((m) => (m.membershipType || '').toLowerCase() === pref);
    if (item)
      return {
        price: item.price ?? 0,
        currency: (item.currency || 'USD').toUpperCase(),
        type: item.membershipType,
        frequency: item.billingFrequency || '',
      };
  }
  const first = memberships[0];
  return {
    price: first?.price ?? 0,
    currency: (first?.currency || 'USD').toUpperCase(),
    type: first?.membershipType,
    frequency: first?.billingFrequency || '',
  };
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [tenantDetails, setTenantDetails] = useState<{ orgGuId?: string; tenantId?: string; cloudName?: string; name?: string; org?: { footerInfo?: string } } | null>(null);
  const [thumbnail, setThumbnail] = useState<string>(DEFAULT_COURSE_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImageLightboxOpen, setHeroImageLightboxOpen] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        let tenant = appLoadService.tenantDetails;
        if (!tenant) {
          tenant = await appLoadService.initAppConfig();
        }
        const tid = tenant?.tenantId ?? tenant?.orgGuId;
        if (!tid) {
          setError('Failed to load tenant.');
          return;
        }
        const result = await courseService.getPublicCourseDetail(tid, id);
        const data = result?.data;
        if (!data) {
          setError('Course not found.');
          return;
        }
        setCourse(data);
        setTenantDetails(tenant);

        if (data.image1 && tenant?.cloudName) {
          setThumbnail(ImageUtils.buildCloudinaryUrl(tenant.cloudName, data.image1, 840, 560, 'fill', '3:2'));
        } else {
          setThumbnail(DEFAULT_COURSE_IMAGE);
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Failed to load course.');
        setCourse(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const isFreeCourse = () => course?.paymentType === 'FREE';
  const isPaidCourse = () =>
    course?.paymentType === 'PAID' || (course as { paymentType?: string })?.paymentType === 'PRODUCT';
  const hasDemoChapters = () => !!course?.isAllowDemoChapters;

  const handleRegister = () => {
    if (!course) return;
    const payment = getPaymentType(course);
    if (payment.type === 'external') {
      const externalUrl = (course as unknown as Record<string, unknown>).externalSaleUrl as string | undefined;
      if (externalUrl) {
        window.open(externalUrl, '_blank');
        return;
      }
    }
    if (payment.type === 'free') {
      if (hasDemoChapters()) {
        navigate(`/preview-register/${id}`);
        return;
      }
      navigate(`/checkout/register/${id}`);
      return;
    }
    if (payment.type === 'donation') {
      const donationGuId = (course as unknown as Record<string, unknown>).donationGuId as string | undefined;
      if (donationGuId) {
        navigate(`/donations/${donationGuId}`);
        return;
      }
    }
    if (payment.type === 'paid' && course.memberships?.length) {
      const firstMembership = course.memberships[0];
      const courseUrlHandle = course.url?.replace(/^\//, '') || course.guId;
      navigate(`/checkout/course/${encodeURIComponent(courseUrlHandle)}/${firstMembership.guId}`);
      return;
    }
  };

  const handleTryIntroductory = () => {
    if (!id) return;
    navigate(`/preview-register/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">{error || 'Course not found.'}</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const itemList = course.memberships ?? [];
  const priceInfo = getCoursePrice(course);
  const paymentType = getPaymentType(course);
  const authorDisplay = course.wemail?.author?.displayTitle ?? course.teacher?.fullName ?? tenantDetails?.name ?? 'Instructor';
  const isCourseContentsShown = false;
  const authorBlock = course.wemail?.author;
  const showAuthorSection =
    authorBlock?.description ||
    authorBlock?.displayTitle ||
    authorBlock?.designation ||
    course.teacher ||
    tenantDetails?.org?.footerInfo ||
    authorDisplay;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero – image with gradient overlay, 3:1 aspect ratio */}
        <div className="relative w-full rounded-2xl overflow-hidden mb-8 sm:mb-12 shadow-lg group" style={{ aspectRatio: '3/1' }}>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => setHeroImageLightboxOpen(true)}
            className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-white backdrop-blur-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:top-4 sm:right-4 sm:px-4 sm:py-2.5"
            aria-label="View full image"
          >
            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs font-semibold sm:text-sm">View image</span>
          </button>
          <ImageLightbox
            isOpen={heroImageLightboxOpen}
            onClose={() => setHeroImageLightboxOpen(false)}
            imageSrc={thumbnail}
            alt={course.name}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-12">
            <div className="max-w-3xl w-full min-w-0 space-y-3 sm:space-y-6">
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {course.isOnlineCourse && (
                  <div className="flex h-7 sm:h-8 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-white/20 backdrop-blur-xl px-2.5 sm:px-3 border border-white/30 shadow-lg">
                    <BookOpen className="text-white size-4 shrink-0" />
                    <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      Online Course
                    </span>
                  </div>
                )}
                {course.productTagList?.[0] && (
                  <div className="flex h-7 sm:h-8 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-primary-500 px-2.5 sm:px-3 shadow-lg ring-1 ring-white/20">
                    <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      {course.productTagList[0]}
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-lg break-words">
                {course.name}
              </h1>
              <div className="inline-flex items-center gap-2 sm:gap-3 bg-black/40 hover:bg-black/50 transition-colors backdrop-blur-xl p-1.5 pr-3 sm:pr-5 rounded-full border border-white/20 shadow-xl max-w-full min-w-0">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cover bg-center border border-white/30 shrink-0"
                  style={{ backgroundImage: `url(${AUTHOR_PLACEHOLDER_IMAGE})` }}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5">
                    By
                  </span>
                  <span className="text-white text-xs sm:text-sm font-semibold truncate sm:truncate-none">
                    {authorDisplay}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-8 space-y-12 order-2 lg:order-1 min-w-0 flex flex-col">
            {(course.shortDescription || course.longDescription) && (
              <section className="min-w-0">
                <p className="text-xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-6 break-words">
                  {course.shortDescription}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  About the Course
                </h2>
                <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {course.template?.unhtml ? (
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-600 prose-p:dark:text-gray-300 prose-headings:text-gray-900 prose-headings:dark:text-white"
                      dangerouslySetInnerHTML={{ __html: course.template.unhtml }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-300">
                      {course.longDescription || course.shortDescription || 'No description available.'}
                    </p>
                  )}
                </div>
              </section>
            )}

            {isCourseContentsShown && (
              <section className="min-w-0">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                  <ChevronRight className="size-5 text-primary-500 dark:text-primary-400" />
                  Course Contents
                </div>
              </section>
            )}

            {/* About the Author – same structure as event’s About the Organizer */}
            {showAuthorSection && (
              <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-8 rounded-xl shadow-sm min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  About the Author
                </h2>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div
                    className="size-24 rounded-xl bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url(${AUTHOR_PLACEHOLDER_IMAGE})` }}
                    aria-hidden
                  />
                  <div className="space-y-3 flex-1 min-w-0">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {authorDisplay}
                      </h3>
                      {authorBlock?.designation && (
                        <p className="text-primary-500 dark:text-primary-400 text-sm font-medium mt-0.5">
                          {authorBlock.designation}
                        </p>
                      )}
                    </div>
                    {(() => {
                      const orgFooterAbout = tenantDetails?.org?.footerInfo;
                      const aboutText = authorBlock?.description ?? orgFooterAbout;
                      return aboutText ? (
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                          {aboutText}
                        </p>
                      ) : null;
                    })()}
                    <div className="flex flex-wrap gap-4">
                      <a
                        href="#"
                        className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                        aria-label="Website"
                      >
                        <Globe className="size-5" />
                        <span className="text-sm">Website</span>
                      </a>
                      <a
                        href="#"
                        className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                        aria-label="Twitter"
                      >
                        <LinkIcon className="size-5" />
                        <span className="text-sm">Twitter</span>
                      </a>
                      <a
                        href="#"
                        className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
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

          {/* Right column – same structure as event details (sticky registration card) */}
          <div className="lg:col-span-4 order-1 lg:order-2 min-w-0 w-full max-w-full self-stretch flex flex-col">
            <div className="lg:sticky lg:top-20 lg:z-30 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow w-full max-w-full min-w-0">
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                    Registration
                  </p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white break-words">
                      {hasDemoChapters() && isFreeCourse()
                        ? 'Introductory Session'
                        : paymentType.type === 'donation'
                          ? 'Donation'
                          : paymentType.type === 'free'
                            ? 'Free'
                            : paymentType.type === 'external'
                              ? 'External'
                              : priceInfo
                                ? `${priceInfo.currency === 'USD' ? '$' : ''}${priceInfo.price}${priceInfo.currency !== 'USD' ? ` ${priceInfo.currency}` : ''}`
                                : '—'}
                    </span>
                    {priceInfo && paymentType.type === 'paid' && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">per person</span>
                    )}
                  </div>
                  {itemList.length > 1 && (
                    <span className="text-primary-500 dark:text-primary-400 text-sm font-bold mt-1 block">
                      +{itemList.length - 1} Plans
                    </span>
                  )}
                </div>
                <div className="space-y-5 mb-8">
                  {course.durationStr && (
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 dark:text-primary-400 shrink-0">
                        <BookOpen className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Duration</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{course.durationStr}</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  size="lg"
                  className="w-full text-lg py-4 rounded-xl"
                  onClick={handleRegister}
                  disabled={itemList.length === 0 && !isFreeCourse() && !hasDemoChapters()}
                >
                  {paymentType.type === 'donation'
                    ? 'Donate'
                    : paymentType.type === 'external'
                      ? 'Register Externally'
                      : 'Register Now'}
                  {paymentType.type === 'external' && <ExternalLink className="ml-2 size-5" />}
                </Button>
                {hasDemoChapters() && isPaidCourse() && (
                  <button
                    type="button"
                    onClick={handleTryIntroductory}
                    className="mt-4 w-full text-center text-primary-500 dark:text-primary-400 font-bold hover:underline text-sm"
                  >
                    Try Introductory Session
                  </button>
                )}
                <p className="text-center text-gray-600 dark:text-gray-300 text-sm mt-4 px-4">
                  Registration may include access to course materials and support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
