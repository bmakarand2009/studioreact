import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button, Pagination } from '@/components/ui';
import { courseService } from '@/services/courseService';
import { Course } from '@/types/course';
import { ImageUtils } from '@/utils/imageUtils';
import { appLoadService } from '@/app/core/app-load';

export default function CoursesListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  
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
   * Fetch courses from API
   */
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await courseService.getCourses({
        start: pageIndex * pageSize,
        max: pageSize,
        search: searchQuery || undefined,
        isShowArchived: showArchived,
      });

      setCourses(response.data);
      setTotalRecords(response.recordsTotal);
    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
      setError(err.message || 'Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, searchQuery, showArchived]);

  /**
   * Initial load and when filters change
   */
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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
   * Reset page when archived filter changes
   */
  useEffect(() => {
    setPageIndex(0);
  }, [showArchived]);


  /**
   * Navigate to add course page
   */
  const handleAddCourse = () => {
    navigate('/admin/courses/add');
  };

  /**
   * Navigate to course details
   */
  const handleCourseClick = (courseId: string) => {
    navigate(`/admin/courses/${courseId}`);
  };

  /**
   * Get course image URL
   */
  const getCourseImage = (course: Course) => {
    return ImageUtils.getCourseCardImage(course, cloudName);
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
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Courses</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your course catalog
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddCourse}
              className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Course
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
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Show Archived
                </span>
              </label>
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
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading courses...</p>
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
                  Error Loading Courses
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <Button 
                  onClick={() => fetchCourses()} 
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
        {!isLoading && !error && courses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No courses found' : 'No courses available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Get started by creating your first course'
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
                onClick={handleAddCourse}
                className="bg-gradient-to-r from-primary-600 to-brand-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Course
              </Button>
            )}
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {courses.map((course) => (
              <div
                key={course.guId}
                onClick={() => handleCourseClick(course.guId)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group flex flex-col"
              >
                {/* Course Image */}
                <div className="relative aspect-[3/2] bg-gradient-to-br from-primary-100 to-brand-100 dark:from-primary-900/30 dark:to-brand-900/30 overflow-hidden">
                  <img
                    src={getCourseImage(course)}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = ImageUtils.buildCloudinaryUrl('', '', 480, 320);
                    }}
                  />
                </div>

                {/* Course Content */}
                <div className="p-4 pt-2 flex flex-col flex-grow">
                  {/* Payment Type Badge */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {course.paymentType === 'FREE' ? (
                      <span className="inline-flex items-center justify-center h-5 px-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold rounded-full">
                        FREE
                      </span>
                    ) : course.paymentType === 'PAID' ? (
                      <span className="inline-flex items-center justify-center h-5 px-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold rounded-full">
                        PAID
                      </span>
                    ) : course.paymentType === 'DONATION' ? (
                      <span className="inline-flex items-center justify-center h-5 px-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-semibold rounded-full">
                        DONATION
                      </span>
                    ) : course.paymentType === 'EXTERNAL' ? (
                      <span className="inline-flex items-center justify-center h-5 px-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-semibold rounded-full">
                        EXTERNAL
                      </span>
                    ) : null}
                  </div>

                  {/* Course Title */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.name}
                  </h3>

                  {/* Description */}
                  {course.shortDescription && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 text-xs flex-grow">
                      {course.shortDescription}
                    </p>
                  )}

                  {/* Course Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {course?.durationStr ? course.durationStr : '30 minutes'}
                        </span>
                    </div>
                    {course.isShowOnWebsite && (
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

