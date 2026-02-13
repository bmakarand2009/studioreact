import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Loader2,
  BookOpen,
  Clock,
  User,
  DollarSign,
  Eye,
  Copy,
  ExternalLink,
  Users,
  Trash2,
  Undo2,
  Layers,
} from "lucide-react";

import { Button, ConfirmationDialog, ToggleSlider } from "@/components/ui";
import { useToast } from "@/components/ui/ToastProvider";
import appLoadService, { TenantDetails } from "@/app/core/app-load";
import { courseDetailService } from "@/services/courseDetailService";
import { BatchManagementDialog } from "@/components/batch-management";
import { batchService, Batch } from "@/services/batchService";
import { AttendeesList } from "@/components/attendees";
import { CourseSetup } from "@/components/setup";
import { CourseContentsSection } from "@/components/course-contents";

// Duration options matching Angular format - stored as human-readable strings
const DURATION_OPTIONS = [
  "5 minutes",
  "30 minutes",
  "1 hour ",
  "2 hours",
  "6 hours",
  "12 hours",
  "1 day",
  "2 days",
  "6 days",
  "1 week",
  "2 weeks",
  "1 month",
  "3 months",
  "6 months",
  "1 year",
];

const getDurationLabel = (value: string | undefined | null): string => {
  if (!value) return "30 minutes"; // Default fallback

  // Trim whitespace for comparison
  const trimmedValue = value.trim();

  // Check if it's already in the correct format (human-readable string)
  const exactMatch = DURATION_OPTIONS.find(
    (option) => option.trim() === trimmedValue,
  );
  if (exactMatch) {
    return exactMatch.trim();
  }

  // If it's a numeric value, try to convert it
  const numericValue = parseInt(trimmedValue, 10);
  if (!isNaN(numericValue)) {
    // Map numeric values to labels (matching the old logic)
    const numericMap: Record<number, string> = {
      5: "5 minutes",
      30: "30 minutes",
      60: "1 hour",
      120: "2 hours",
      360: "6 hours",
      720: "12 hours",
      1440: "1 day",
      2880: "2 days",
      8640: "6 days",
      10080: "1 week",
      20160: "2 weeks",
      43200: "1 month",
      129600: "3 months",
      259200: "6 months",
      525600: "1 year",
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

const VALID_TABS = ["attendees", "content", "pricing", "setup"] as const;
type TabKey = (typeof VALID_TABS)[number];

const getTabFromSearch = (search: string | undefined | null): TabKey => {
  if (!search) return "attendees";
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  return VALID_TABS.includes(tab as TabKey) ? (tab as TabKey) : "attendees";
};

const CourseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(
    null,
  );
  const [courseData, setCourseData] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [, setExistingCategories] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewMenu, setShowPreviewMenu] = useState<boolean>(false);
  const previewMenuRef = useRef<HTMLDivElement>(null);
  const [showBatchDialog, setShowBatchDialog] = useState<boolean>(false);
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    getTabFromSearch(window.location?.search),
  );
  const [batches, setBatches] = useState<Batch[]>([]);
  const [testToggleChecked, setTestToggleChecked] = useState(false);

  // Keep active tab in sync with URL (?tab=...)
  useEffect(() => {
    const urlTab = getTabFromSearch(location.search);
    setActiveTab((current) => (current === urlTab ? current : urlTab));
  }, [location.search]);

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      const params = new URLSearchParams(location.search);
      params.set("tab", tab);
      navigate(
        {
          pathname: location.pathname,
          search: params.toString(),
        },
        { replace: true },
      );
    },
    [location.pathname, location.search, navigate],
  );

  const authorName = useMemo(() => {
    if (!courseData) return "N/A";
    const wemail = courseData?.wemail || {};
    const authorType =
      wemail?.authorType || courseData?.authorType || "organization";

    if (authorType === "teacher") {
      const authorId = wemail?.authorId || courseData?.authorId;
      const teacher = staffList.find((staff) => staff.guId === authorId);
      return teacher?.name || "Unknown Teacher";
    }
    return tenantDetails?.name || "Organization";
  }, [courseData, staffList, tenantDetails]);

  const salesPageUrl = useMemo(() => {
    if (!courseData) return "";
    // Use url field if available, otherwise fallback to guId
    const courseUrl = courseData.url || courseData.guId;
    if (!courseUrl) return "";
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
      if (event.key === "Escape" && showPreviewMenu) {
        setShowPreviewMenu(false);
      }
    };

    if (showPreviewMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [showPreviewMenu]);

  const handlePreview = () => {
    if (!salesPageUrl) {
      toast.error(
        "Course URL not available. Please ensure the course has a URL slug.",
      );
      setShowPreviewMenu(false);
      return;
    }
    window.open(salesPageUrl, "_blank");
    setShowPreviewMenu(false);
  };

  const handleCopyLink = async () => {
    if (!salesPageUrl) {
      toast.error(
        "Course URL not available. Please ensure the course has a URL slug.",
      );
      setShowPreviewMenu(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(salesPageUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = salesPageUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link. Please copy manually.");
      }
      document.body.removeChild(textArea);
    }
    setShowPreviewMenu(false);
  };

  const loadCourseData = useCallback(async () => {
    if (!id) {
      setError("Course ID is required");
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
        tenant?.tenantId
          ? courseDetailService.getCategories(tenant.tenantId)
          : Promise.resolve([]),
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

      // Load batches for attendees filter
      loadBatches();
    } catch (err: any) {
      console.error("[CourseDetailsPage] Failed to load course", err);
      setError(err?.message || "Failed to load course details.");
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

  const loadBatches = useCallback(async () => {
    try {
      const allBatches = await batchService.getBatches();
      const filteredBatches = allBatches.filter((batch) => !batch.isDynamic);
      setBatches(filteredBatches);
    } catch (error: any) {
      console.error("Failed to load batches:", error);
    }
  }, []);

  const handleDeleteCourse = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Course",
      description: "Are you sure you want to delete this course?",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
          await courseDetailService.deleteCourse(id);
          toast.success("Course deleted successfully");
          setTimeout(() => {
            navigate("/admin/courses");
          }, 2000);
        } catch (error: any) {
          toast.error(error.message || "Failed to delete course");
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const handleRestoreCourse = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Restore Course",
      description: "Are you sure you want to restore this course?",
      confirmText: "Restore",
      variant: "info",
      onConfirm: async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
          await courseDetailService.restoreCourse(id, { isDeleted: false });
          toast.success("Course restored successfully");
          setTimeout(() => {
            navigate("/admin/courses");
          }, 2000);
        } catch (error: any) {
          toast.error(error.message || "Failed to restore course");
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Loading course details...
          </p>
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Course Not Found
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error || "The course you are looking for does not exist."}
          </p>
          <Button
            onClick={() => navigate("/admin/courses")}
            variant="secondary"
          >
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
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => navigate("/admin/courses")}
                aria-label="Back to courses"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <div className="m-0 p-0 text-xl font-bold leading-tight text-slate-900 dark:text-white">
                    Course Details
                  </div>
                  <ToggleSlider
                    checked={testToggleChecked}
                    onCheckedChange={async (checked: boolean) => {
                      setTestToggleChecked(checked);
                      await new Promise((r) => setTimeout(r, 800));
                    }}
                    aria-label="Toggle course visibility"
                    labelOff="Private"
                    labelOn="Published"
                  />
                  {courseData?.isDisabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-secondary-500 text-white">
                      Deleted
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {courseData?.name || "View course information"}
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

              {!courseData?.isDisabled && (
                <Button
                  onClick={handleDeleteCourse}
                  className="rounded-lg border-2 border-secondary-500 bg-white px-3 py-2 text-sm font-semibold text-secondary-500 shadow-sm transition hover:bg-secondary-50 hover:border-secondary-600 hover:text-secondary-600 dark:border-secondary-500 dark:bg-slate-800 dark:text-secondary-500 dark:hover:bg-secondary-900/20 dark:hover:border-secondary-400 dark:hover:text-secondary-400"
                  aria-label="Delete course"
                  title="Delete course"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {!courseData?.isDisabled && (
                <Button
                  onClick={handleEdit}
                  className="rounded-lg bg-primary-500 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course
                </Button>
              )}
              {courseData?.isDisabled && (
                <Button
                  onClick={handleRestoreCourse}
                  className="rounded-lg bg-primary-500 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-500"
                  aria-label="Restore course"
                  title="Restore course"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Restore Course
                </Button>
              )}
            </div>
          </div>

          {/* Course Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
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
                  {courseData.paymentType === "FREE"
                    ? "Free"
                    : courseData.price
                      ? `$${courseData.price}`
                      : courseData.paymentType || "N/A"}
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
                  {getDurationLabel(
                    courseData?.wemail?.durationStr || courseData?.durationStr,
                  )}
                </p>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-primary-500 dark:text-primary-400" />
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

            {/* Current Batch */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Current Batch
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {currentBatch?.name || "No batch selected"}
                  </p>
                  <button
                    onClick={() => setShowBatchDialog(true)}
                    className="flex-shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Manage Batch"
                    title="Manage Batch"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - reduced padding on very small screens */}
      <main className="mx-auto mt-4 max-w-7xl px-3 sm:mt-8 sm:px-6 lg:px-8">
        {/* Tabs - scrollable on small screens */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg">
          <nav
            className="flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden p-3 -mx-3 sm:mx-0 sm:px-3"
            style={{ WebkitOverflowScrolling: "touch" }}
            aria-label="Tabs"
          >
            <button
              onClick={() => handleTabChange("content")}
              className={`
              shrink-0 whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 font-medium text-sm transition-colors rounded-lg
                ${
                  activeTab === "content"
                    ? "bg-primary-500 text-white shadow-md dark:bg-primary-500 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              Contents
            </button>
            <button
              onClick={() => handleTabChange("attendees")}
              className={`
              shrink-0 whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 font-medium text-sm transition-colors rounded-lg
                ${
                  activeTab === "attendees"
                    ? "bg-primary-500 text-white shadow-md dark:bg-primary-500 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              Attendees
            </button>
            <button
              onClick={() => handleTabChange("pricing")}
              className={`
              shrink-0 whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 font-medium text-sm transition-colors rounded-lg
                ${
                  activeTab === "pricing"
                    ? "bg-primary-500 text-white shadow-md dark:bg-primary-500 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              Pricing
            </button>
            <button
              onClick={() => handleTabChange("setup")}
              className={`
              shrink-0 whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 font-medium text-sm transition-colors rounded-lg
                ${
                  activeTab === "setup"
                    ? "bg-primary-500 text-white shadow-md dark:bg-primary-500 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              Setup
            </button>
          </nav>
        </div>

        {/* Tab Content - reduced padding on very small screens */}
        <div className="mt-4 sm:mt-6">
          {activeTab === "attendees" && (
            <div className="rounded-lg bg-white p-4 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
              <AttendeesList
                productId={id || ""}
                productName={courseData.name || ""}
                productType="course"
                paymentType={courseData.paymentType}
                batches={batches}
                currentBatchId={currentBatch?.guId}
              />
            </div>
          )}

          {activeTab === "content" && (
              <CourseContentsSection
                courseId={id || ""}
                courseObject={courseData}
                isMasterTenant={tenantDetails?.tenantId === courseData?.tid}
                onRefresh={loadCourseData}
              />
          )}

          {activeTab === "pricing" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
              <p className="text-slate-600 dark:text-slate-400">
                Pricing content will be added here.
              </p>
            </div>
          )}

          {activeTab === "setup" && courseData && (
            <div className="rounded-lg bg-white p-4 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
              <CourseSetup
                productInfo={courseData}
                isMasterTenant={tenantDetails?.tenantId === courseData?.tid}
                isFranchiseCourse={courseData?.isFranchiseCourse}
                onSettingsUpdated={() => {
                  // Reload course data after settings update
                  loadCourseData();
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Batch Management Dialog */}
      {id && courseData && (
        <BatchManagementDialog
          isOpen={showBatchDialog}
          onClose={() => setShowBatchDialog(false)}
          itemId={id}
          itemName={courseData.name || ""}
          currentBatchId={currentBatch?.guId}
          onBatchChanged={handleBatchChanged}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => {
            setConfirmDialog(null);
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default CourseDetailsPage;
