import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  BookOpen, 
  Loader2,
  Clock,
} from 'lucide-react';
import { appLoadService } from '@/app/core/app-load';
import { ImageUtils } from '@/utils/imageUtils';

interface Course {
  guId: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  url: string;
  image1?: string;
  image2?: string;
  image3?: string;
  videoUrl?: string;
  categoryType: string;
  isMediaExists?: boolean;
  slides?: Array<{ image: string; active?: boolean }>;
  productTagList?: string[];
  paymentType?: string;
  durationStr?: string;
}

export default function CourseCatalogPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch tenant details and courses
  useEffect(() => {
    const loadCourses = async () => {
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

        // Fetch courses from API
        const apiUrl = `${import.meta.env.VITE_API_URL || 'https://api.wajooba.me'}/snode/icategory/public/?tid=${tenant.tenantId}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }

        const courseAndProductList = await response.json();
        
        // Process courses similar to Angular component
        const processedCourses: Course[] = [];
        
        if (Array.isArray(courseAndProductList)) {
          courseAndProductList.forEach((course: any) => {
            // Only include courses, not products
            if (course.categoryType !== 'PRODUCT') {
              // Set isMediaExists flag
              if (course.videoUrl || course.image1) {
                course.isMediaExists = true;
              }
              
              // Create slides from images using ImageUtils with 3:2 aspect ratio (landscape)
              const slides: Array<{ image: string; active?: boolean }> = [];
              if (course.image1) {
                slides.push({ 
                  image: ImageUtils.buildCloudinaryUrl(tenant.cloudName, course.image1, 480, 320, 'fill', '3:2'), 
                  active: true 
                });
              }
              if (course.image2) {
                slides.push({ 
                  image: ImageUtils.buildCloudinaryUrl(tenant.cloudName, course.image2, 480, 320, 'fill', '3:2') 
                });
              }
              if (course.image3) {
                slides.push({ 
                  image: ImageUtils.buildCloudinaryUrl(tenant.cloudName, course.image3, 480, 320, 'fill', '3:2') 
                });
              }
              course.slides = slides;
              
              // Add Cloudinary URL to image1 using ImageUtils with 3:2 aspect ratio (landscape)
              if (course.image1) {
                course.image1 = ImageUtils.buildCloudinaryUrl(tenant.cloudName, course.image1, 480, 320, 'fill', '3:2');
              }
              
              processedCourses.push(course);
            }
          });
        }
        
        setCourses(processedCourses);
        setFilteredCourses(processedCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);


  // Filter courses based on search term and category
  useEffect(() => {
    let filtered = [...courses];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.name?.toLowerCase().includes(searchLower) ||
        course.shortDescription?.toLowerCase().includes(searchLower) ||
        course.longDescription?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(course => {
        if (course.productTagList && course.productTagList.length > 0) {
          return course.productTagList.includes(selectedCategory);
        }
        return false;
      });
    }

    setFilteredCourses(filtered);
  }, [searchTerm, selectedCategory, courses]);

  // Get unique categories from courses
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    courses.forEach(course => {
      if (course.productTagList && course.productTagList.length > 0) {
        course.productTagList.forEach(tag => categorySet.add(tag));
      }
    });
    return ['All', ...Array.from(categorySet).sort()];
  }, [courses]);

  const handleCourseClick = (course: Course) => {
    // Navigate using course URL handle (API expects url, not guId)
    const urlHandle = course.url?.replace(/^\//, '') || course.guId;
    if (urlHandle) {
      navigate(`/courses/${encodeURIComponent(urlHandle)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
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
              Explore Our Courses
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover high-quality courses from expert instructors. Start your learning journey today.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 1 && (
              <div className="flex gap-3">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedCategory !== 'All' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No courses are available at the moment.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredCourses.map((course) => (
                <div 
                  key={course.guId} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer flex flex-col h-full"
                  onClick={() => handleCourseClick(course)}
                >
                  {/* Course Image - 3:2 aspect ratio (landscape) */}
                  <div className="relative bg-gradient-to-br from-primary-100 to-brand-100 dark:from-primary-900/30 dark:to-brand-900/30 overflow-hidden" style={{ aspectRatio: '3/2' }}>
                    {course.image1 ? (
                      <img 
                        src={course.image1} 
                        alt={course.name}
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '3/2' }}
                        onError={(e) => {
                          // Fallback to placeholder icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ aspectRatio: '3/2' }}>
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                    {course.paymentType && (
                      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {course.paymentType === 'FREE' ? 'Free' : course.paymentType === 'PAID' ? 'Paid' : course.paymentType}
                      </div>
                    )}
                  </div>

                  {/* Course Content – duration and category chips at bottom */}
                  <div className="px-6 py-4 flex flex-col flex-grow min-h-0">
                    <div className="flex-1 min-h-0 flex flex-col">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {course.name}
                      </h3>

                      {(course.shortDescription || course.longDescription) && (
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2 overflow-hidden">
                          {course.shortDescription || course.longDescription}
                        </p>
                      )}
                    </div>

                    {/* Bottom row: duration chip and category chips in one row (chips scrollable); only show border when there are chips */}
                    {(course.durationStr || (course.productTagList && course.productTagList.length > 0)) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {course.durationStr && (
                        <span className="shrink-0 inline-flex h-6 items-center justify-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-700 px-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {course.durationStr}
                        </span>
                      )}
                      {course.productTagList && course.productTagList.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-0.5 -mx-1 min-w-0 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {course.productTagList.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex shrink-0 items-center justify-center min-w-[80px] h-6 px-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-brand-600 dark:from-primary-700 dark:to-brand-700 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Can&apos;t Find What You&apos;re Looking For?
          </h2>
          <p className="text-lg text-primary-100 dark:text-primary-200 mb-6">
            Contact our team to discuss custom course development or specific learning needs.
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
              className="px-6 py-2 bg-white dark:bg-gray-100 text-primary-600 dark:text-primary-700 hover:bg-gray-100 dark:hover:bg-gray-200"
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
