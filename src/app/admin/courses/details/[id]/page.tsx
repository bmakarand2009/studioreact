import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Loader2,
  BookOpen,
  Clock,
  User,
  Tag,
  DollarSign,
  Calendar,
  Globe,
  FileText,
  Image as ImageIcon,
  Eye,
  Copy,
  ExternalLink,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import appLoadService, { TenantDetails } from '@/app/core/app-load';
import { courseDetailService } from '@/services/courseDetailService';
import { ImageUtils } from '@/utils/imageUtils';
import { BatchManagementDialog } from '@/components/batch-management';
import { batchService, Batch } from '@/services/batchService';

const PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';

// Duration options matching Angular format - stored as human-readable strings
const DURATION_OPTIONS = [
  '5 minutes',
  '30 minutes',
  '1 hour ',
  '2 hours',
  '6 hours',
  '12 hours',
  '1 day',
  '2 days',
  '6 days',
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
  '6 months',
  '1 year',
];

const getDurationLabel = (value: string | undefined | null): string => {
  if (!value) return '30 minutes'; // Default fallback
  
  // Trim whitespace for comparison
  const trimmedValue = value.trim();
  
  // Check if it's already in the correct format (human-readable string)
  const exactMatch = DURATION_OPTIONS.find((option) => option.trim() === trimmedValue);
  if (exactMatch) {
    return exactMatch.trim();
  }
  
  // If it's a numeric value, try to convert it
  const numericValue = parseInt(trimmedValue, 10);
  if (!isNaN(numericValue)) {
    // Map numeric values to labels (matching the old logic)
    const numericMap: Record<number, string> = {
      5: '5 minutes',
      30: '30 minutes',
      60: '1 hour',
      120: '2 hours',
      360: '6 hours',
      720: '12 hours',
      1440: '1 day',
      2880: '2 days',
      8640: '6 days',
      10080: '1 week',
      20160: '2 weeks',
      43200: '1 month',
      129600: '3 months',
      259200: '6 months',
      525600: '1 year',
    };
    
    if (numericMap[numericValue]) {
      return numericMap[numericValue];
    }
    
    // Fallback: assume it's minutes
    return `${numericValue} minutes`;
  }
  
  // If it's already a readable string but not in our list, return as-is
  return trimmedValue;
};

const CourseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [existingCategories, setExistingCategories] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewMenu, setShowPreviewMenu] = useState<boolean>(false);
  const previewMenuRef = useRef<HTMLDivElement>(null);
  const [showBatchDialog, setShowBatchDialog] = useState<boolean>(false);
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);

  const bannerImageUrl = useMemo(() => {
    if (!courseData?.image1) {
      return PLACEHOLDER_IMAGE;
    }
    if (courseData.image1.startsWith('http')) {
      return courseData.image1;
    }
    if (tenantDetails?.cloudName) {
      return `https://res.cloudinary.com/${tenantDetails.cloudName}/image/upload/c_fill,h_400,w_800/${courseData.image1}`;
    }
    return PLACEHOLDER_IMAGE;
  }, [courseData?.image1, tenantDetails]);

  const authorName = useMemo(() => {
    if (!courseData) return 'N/A';
    const wemail = courseData?.wemail || {};
    const authorType = wemail?.authorType || courseData?.authorType || 'organization';
    
    if (authorType === 'teacher') {
      const authorId = wemail?.authorId || courseData?.authorId;
      const teacher = staffList.find((staff) => staff.guId === authorId);
      return teacher?.name || 'Unknown Teacher';
    }
    return tenantDetails?.name || 'Organization';
  }, [courseData, staffList, tenantDetails]);

  const categories = useMemo(() => {
    if (!courseData) return [];
    const categoryIds = Array.isArray(courseData?.productCategoryList)
      ? courseData.productCategoryList.map((cat: any) => cat?.id || cat?.guId || cat)
      : Array.isArray(courseData?.productCategory)
      ? courseData.productCategory.map((cat: any) => cat?.id || cat?.guId || cat)
      : [];
    
    return existingCategories.filter((cat) => categoryIds.includes(cat.id));
  }, [courseData, existingCategories]);

  const tags = useMemo<string[]>(() => {
    if (!courseData) return [];
    const wemail = courseData?.wemail || {};
    return Array.isArray(wemail?.productTagList) && wemail.productTagList.length
      ? wemail.productTagList
      : Array.isArray(courseData?.productTagList)
      ? courseData.productTagList
      : [];
  }, [courseData]);

  const longDescription = useMemo(() => {
    if (!courseData) return '';
    const wemail = courseData?.wemail || {};
    return wemail?.longDescription || courseData?.longDescription || '';
  }, [courseData]);

  const salesPageUrl = useMemo(() => {
    if (!courseData) return '';
    // Use url field if available, otherwise fallback to guId
    const courseUrl = courseData.url || courseData.guId;
    if (!courseUrl) return '';
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/courses/${courseUrl}`;
  }, [courseData]);

  // Close preview menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        previewMenuRef.current &&
        !previewMenuRef.current.contains(event.target as Node) &&
        showPreviewMenu
      ) {
        setShowPreviewMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPreviewMenu) {
        setShowPreviewMenu(false);
      }
    };

    if (showPreviewMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showPreviewMenu]);

  const handlePreview = () => {
    if (!salesPageUrl) {
      toast.error('Course URL not available. Please ensure the course has a URL slug.');
      setShowPreviewMenu(false);
      return;
    }
    window.open(salesPageUrl, '_blank');
    setShowPreviewMenu(false);
  };

  const handleCopyLink = async () => {
    if (!salesPageUrl) {
      toast.error('Course URL not available. Please ensure the course has a URL slug.');
      setShowPreviewMenu(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(salesPageUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = salesPageUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Link copied to clipboard!');
      } catch (fallbackErr) {
        toast.error('Failed to copy link. Please copy manually.');
      }
      document.body.removeChild(textArea);
    }
    setShowPreviewMenu(false);
  };

  const loadCourseData = useCallback(async () => {
    if (!id) {
      setError('Course ID is required');
      setIsPageLoading(false);
      return;
    }

    setIsPageLoading(true);
    setError(null);

    try {
      const tenant = await appLoadService.initAppConfig();
      setTenantDetails(tenant);

      const [courseResponse, staff, categories] = await Promise.all([
        courseDetailService.getCourseDetail(id),
        courseDetailService.getStaffList(),
        tenant?.tenantId ? courseDetailService.getCategories(tenant.tenantId) : Promise.resolve([]),
      ]);

      const course = courseResponse?.data || courseResponse;
      setCourseData(course);
      setStaffList(staff);
      setExistingCategories(categories);
      
      // Set current batch if available
      if (course?.currentBatch) {
        setCurrentBatch(course.currentBatch);
      } else {
        setCurrentBatch(null);
      }
    } catch (err: any) {
      console.error('[CourseDetailsPage] Failed to load course', err);
      setError(err?.message || 'Failed to load course details.');
    } finally {
      setIsPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Scroll to top when component mounts or id changes
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/courses/edit/${id}`);
    }
  };

  const handleBatchChanged = useCallback(() => {
    // Reload course data when batch changes
    loadCourseData();
  }, [loadCourseData]);

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Course Not Found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error || 'The course you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/admin/courses')} variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto max-w-5xl px-6 py-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => navigate('/admin/courses')}
                aria-label="Back to courses"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Course Details
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {courseData?.name || 'View course information'}
              </p>
            </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Preview Button */}
              <div ref={previewMenuRef} className="relative">
                <Button
                  onClick={() => setShowPreviewMenu(!showPreviewMenu)}
                  variant="ghost"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:bg-white focus:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:bg-slate-800"
                  aria-label="Preview options"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                {/* Preview Menu */}
                {showPreviewMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[180px] overflow-hidden">
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-t-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePreview();
                      }}
                      disabled={!salesPageUrl}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors border-t border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyLink();
                      }}
                      disabled={!salesPageUrl}
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleEdit}
                className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Button>
            </div>
          </div>
          
          {/* Batch Selection */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Current Batch -</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {currentBatch?.name || 'No batch selected'}
              </span>
              <Button
                onClick={() => setShowBatchDialog(true)}
                variant="ghost"
                size="sm"
                className="p-1.5"
                aria-label="Manage Batch"
                title="Manage Batch"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Course Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {/* Author */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Author
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {authorName}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Duration
                </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                      {getDurationLabel(courseData?.wemail?.durationStr || courseData?.durationStr)}
                    </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Price
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {courseData.paymentType === 'FREE' 
                    ? 'Free' 
                    : courseData.price 
                    ? `$${courseData.price}` 
                    : courseData.paymentType || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto mt-8 max-w-5xl px-6 lg:px-8">
        <div className="space-y-8">
          {/* Course Banner */}
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
              <img
                src={bannerImageUrl}
                alt={courseData.name}
                className="h-64 w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>
          </section>

          {/* Course Information */}
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {courseData.name}
                </h2>
                {courseData.shortDescription && (
                  <p className="text-lg text-slate-600 dark:text-slate-300">
                    {courseData.shortDescription}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Status
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                      {courseData.isShowOnWebsite ? 'Published' : 'Draft'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Categories
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Tags
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string, index: number) => (
                      <span
                        key={`tag-${index}-${tag}`}
                        className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Long Description */}
              {longDescription && (
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Description
                    </p>
                  </div>
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: longDescription }}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      
      {/* Batch Management Dialog */}
      {id && courseData && (
        <BatchManagementDialog
          isOpen={showBatchDialog}
          onClose={() => setShowBatchDialog(false)}
          itemId={id}
          itemName={courseData.name || ''}
          currentBatchId={currentBatch?.guId}
          onBatchChanged={handleBatchChanged}
        />
      )}
    </div>
  );
};

export default CourseDetailsPage;
