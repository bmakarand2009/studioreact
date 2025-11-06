## **Context**

You are implementing a **production-ready Course List page** for a React-based multi-tenant education platform. You have:

1. **Design Reference**: A beautiful, modern UI in React with Tailwind CSS (`studioreact/src/app/(public)/courses/page.tsx`)
2. **Business Logic Reference**: A fully functional Angular component with complete API integration (`v5byclasses/myapp/src/app/main/admin/product-bundle/product-bundle-list`)

## **Objective**

Transform the static React courses page into a fully functional component by implementing:
- Real API integration for course data
- Search and filtering functionality
- Pagination (load more)
- Loading states with skeletons
- Error handling
- Image optimization via Cloudinary
- Multi-tenant support

---

## **📋 Requirements**

### **1. API Integration**

**Base Configuration:**
```typescript
// Environment: studioreact/src/config/environments/
apiBaseUrl: 'https://api.wajooba.me'
```

**Primary Endpoint:**
```
GET /snode/icategory?type=service&include=stats&draw=1&start={offset}&length={limit}
```

**Alternative Endpoint (if using unified products API):**
```
GET /snode/icategory/products?types=course
```

**Query Parameters:**
- `start` - Pagination offset (default: 0)
- `length` - Page size (default: 50)
- `type=service` - Filter for courses (vs products/bundles)
- `include=stats` - Include enrollment/student counts
- `draw=1` - Required parameter for the API
- `search={query}` - Search term (optional)
- `isShowAll=true` - Include archived courses (optional)

**Expected Response:**
```typescript
{
  c: number;
  draw: number;
  recordsTotal: number;        // Total number of courses
  recordsFiltered: number;     // Number of filtered results
  data: Array<{
    guId: string;              // Unique identifier
    id: string;                // Same as guId
    name: string;              // Course name
    shortDescription: string;  // Brief description
    longDescription?: string;  // Full HTML description
    image1?: string;           // Cloudinary path (e.g., "marksampletest-9xP0p480zR/path.jpg")
    paymentType: 'PAID' | 'FREE' | 'DONATION' | 'EXTERNAL';
    isShowOnWebsite: boolean;
    isOnlineCourse: boolean;
    categoryType: 'SERVICE' | 'course' | 'service' | 'nodeitemcategory';
    dateCreated: number;       // Unix timestamp
    dateUpdated: number;       // Unix timestamp
    dateCreatedStr: string;    // Formatted date (MM/DD/YYYY)
    dateUpdatedStr: string;    // Formatted date (MM/DD/YYYY)
    durationStr?: string;      // e.g., "30 minutes" or "30"
    url: string;               // URL slug
    tid: string;               // Tenant ID
    tenantId: number;          // Tenant numeric ID
    categoryId: number;
    sequence: number;          // Sort order
    classColor?: string;       // e.g., "bg-color-red txt-color-white"
    authorId?: string;
    authorType?: string;       // "organization" | "teacher"
    isDisabled: boolean;
    isFranchiseCourse: boolean;
    isMasterCourse?: boolean;
    isAllowDemoChapters: boolean;
    registrationFormId: string;
    productTagList: string[];  // Tags/categories
    quizList: string[];        // Associated quiz IDs
    highlightsList: Array<{    // Course highlights/features
      value: string;
      editing?: boolean;
    }>;
    isCOPPACompliant: boolean;
    // Additional optional fields
    additionalAdminEmailsCsv?: string;
    adminCategoryCompletionTemplateId?: string;
    wemailTemplateId?: string;
    isSendWelcomeEmail?: boolean;
    registrationSuccessPageTemplateId?: string;
    upsellProductList?: Array<{
      id: string;
      productType: string;
      name: string;
    }>;
  }>,
  wemail: {}
}
```

### **2. Authentication**

**Headers Required:**
```typescript
{
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json'
}
```

**Token Source:**
- Check existing `authService.ts` or `authStore.ts`
- Token should be stored in localStorage/sessionStorage
- Implement auto-refresh if expired

### **3. Image Handling (Cloudinary)**

**URL Pattern:**
```typescript
// Default placeholder
'https://res.cloudinary.com/wajooba/image/upload/c_thumb,h_320,w_480/v1692705773/master/placeholder.jpg'

// Optimized image URL
`https://res.cloudinary.com/${cloudName}/image/upload/c_fill,h_${height},w_${width}/${imagePath}`
```

**Parameters:**
- `cloudName` - From tenant config (via ping API)
- `c_fill` - Crop mode (fill, fit, scale)
- `h_320` - Height in pixels
- `w_480` - Width in pixels
- `imagePath` - From course.image1

### **4. State Management**

**Required State Variables:**
```typescript
const [courses, setCourses] = useState<Course[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All');
const [selectedLevel, setSelectedLevel] = useState('All Levels');
const [pageIndex, setPageIndex] = useState(0);
const [pageSize, setPageSize] = useState(9);
const [totalRecords, setTotalRecords] = useState(0);
const [hasMore, setHasMore] = useState(true);
```

### **5. Service Layer**

**Create/Update:** `studioreact/src/services/courseService.ts`

**Required Methods:**
```typescript
// Fetch courses with filters
getCourses(options: {
  start: number;
  max: number;
  search?: string;
  category?: string;
  level?: string;
  isShowAll?: boolean;
}): Promise<CoursesResponse>

// Get course details
getCourseDetails(guId: string): Promise<Course>

// Get public course list (no auth required)
getPublicCourses(tenantId: string): Promise<Course[]>
```

---

## **🎨 Design Preservation**

**Keep from React App:**
1. ✅ Tailwind CSS classes and styling
2. ✅ Dark mode support (`dark:` classes)
3. ✅ Responsive grid layout (1-2-3 columns)
4. ✅ Card-based design with gradients
5. ✅ Icon usage from Lucide React
6. ✅ Typography and spacing
7. ✅ Search bar UI
8. ✅ Filter dropdowns UI
9. ✅ CTA section at bottom
10. ✅ Button components

**Update/Replace:**
1. ❌ Hardcoded mock data → API data
2. ❌ Static categories → Dynamic from API
3. ❌ Non-functional search → Real search
4. ❌ Non-functional filters → Real filters
5. ❌ "Load More" button → Functional pagination
6. ❌ Placeholder images → Cloudinary URLs

---

## **📝 Implementation Steps**

### **Step 1: Create TypeScript Interfaces**

```typescript
// studioreact/src/types/course.ts

export interface Course {
  guId: string;
  id: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  url: string;
  image1?: string;
  paymentType: 'PAID' | 'FREE' | 'DONATION' | 'EXTERNAL';
  isShowOnWebsite: boolean;
  isOnlineCourse: boolean;
  categoryType: 'SERVICE' | 'course' | 'service' | 'nodeitemcategory';
  dateCreated: number;
  dateUpdated: number;
  dateCreatedStr: string;
  dateUpdatedStr: string;
  durationStr?: string;
  tid: string;
  tenantId: number;
  categoryId: number;
  sequence: number;
  classColor?: string;
  authorId?: string;
  authorType?: string;
  isDisabled: boolean;
  isFranchiseCourse: boolean;
  isMasterCourse?: boolean;
  isAllowDemoChapters: boolean;
  registrationFormId: string;
  productTagList: string[];        // Use this for categories/tags
  quizList: string[];
  highlightsList: Array<{
    value: string;
    editing?: boolean;
  }>;
  isCOPPACompliant: boolean;
  // Optional marketing/email fields
  additionalAdminEmailsCsv?: string;
  adminCategoryCompletionTemplateId?: string;
  wemailTemplateId?: string;
  isSendWelcomeEmail?: boolean;
  registrationSuccessPageTemplateId?: string;
  upsellProductList?: Array<{
    id: string;
    productType: string;
    name: string;
  }>;
}

export interface CoursesResponse {
  c: number;
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Course[];
  wemail: {};
}

export interface CourseFilters {
  start: number;
  max: number;
  search?: string;
  type?: string;              // 'service' for courses
  include?: string;           // 'stats' to include statistics
  draw?: string;              // API requirement
  isShowAll?: boolean;
}
```

### **Step 2: Create/Update Course Service**

```typescript
// studioreact/src/services/courseService.ts

import { api } from './api';
import { Course, CoursesResponse, CourseFilters } from '@/types/course';

export const courseService = {
  /**
   * Fetch courses with filtering and pagination
   */
  async getCourses(filters: CourseFilters): Promise<CoursesResponse> {
    const params = new URLSearchParams({
      type: 'service',
      include: 'stats',
      draw: '1',
      start: filters.start.toString(),
      length: filters.max.toString(),
    });

    if (filters.search) {
      params.append('search', filters.search);
    }

    if (filters.isShowAll) {
      params.append('isShowAll', 'true');
    }

    const response = await api.get(`/snode/icategory?${params.toString()}`);
    return response.data;
  },

  /**
   * Get course details by ID
   */
  async getCourseDetails(guId: string): Promise<Course> {
    const response = await api.get(`/snode/icategory/${guId}?include=details,template`);
    return response.data;
  },

  /**
   * Get public courses (no auth required)
   */
  async getPublicCourses(tenantId: string): Promise<Course[]> {
    const response = await api.get(`/snode/icategory/public?tid=${tenantId}&type=service`);
    return response.data;
  },

  /**
   * Get categories dynamically from productTagList
   */
  getCategories(courses: Course[]): string[] {
    const categories = new Set<string>();
    courses.forEach(course => {
      if (course.productTagList && course.productTagList.length > 0) {
        course.productTagList.forEach(tag => categories.add(tag));
      }
    });
    return ['All', ...Array.from(categories)];
  },
};
```

### **Step 3: Create Image Utility**

```typescript
// studioreact/src/utils/imageUtils.ts

export class ImageUtils {
  private static PLACEHOLDER = 
    'https://res.cloudinary.com/wajooba/image/upload/c_thumb,h_320,w_480/v1692705773/master/placeholder.jpg';

  /**
   * Build optimized Cloudinary URL
   */
  static buildCloudinaryUrl(
    cloudName: string,
    imagePath: string | undefined,
    width: number = 480,
    height: number = 320,
    crop: 'fill' | 'fit' | 'scale' = 'fill'
  ): string {
    if (!imagePath || !cloudName) {
      return this.PLACEHOLDER;
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/c_${crop},h_${height},w_${width}/${imagePath}`;
  }

  /**
   * Get course image with fallback
   */
  static getCourseImage(course: Course, cloudName?: string): string {
    if (!course.image1) {
      return this.PLACEHOLDER;
    }

    if (cloudName) {
      return this.buildCloudinaryUrl(cloudName, course.image1, 480, 320, 'fill');
    }

    return this.PLACEHOLDER;
  }
}
```

### **Step 4: Update Courses Page Component**

```typescript
// studioreact/src/app/(public)/courses/page.tsx

'use client'; // If using Next.js App Router

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Users, 
  Star,
  ArrowRight,
  Play,
  Loader2
} from 'lucide-react';
import { courseService } from '@/services/courseService';
import { ImageUtils } from '@/utils/imageUtils';
import { Course } from '@/types/course';
import { useAuth } from '@/hooks/useAuth'; // Or your auth hook
import { useAppConfig } from '@/hooks/useAppConfig'; // For tenant config

export default function CourseCatalogPage() {
  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(9);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Get tenant config (cloudName for images)
  const { tenantConfig } = useAppConfig();
  const cloudName = tenantConfig?.cloudName;

  // Dynamic categories from loaded courses
  const [categories, setCategories] = useState(['All']);
  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

  /**
   * Fetch courses from API
   */
  const fetchCourses = useCallback(async (append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const start = append ? courses.length : 0;
      
      const response = await courseService.getCourses({
        start,
        max: pageSize,
        search: searchTerm || undefined,
        isShowAll: false,
      });

      const newCourses = response.data;
      
      // Filter for public display (only show courses marked for website)
      let filtered = newCourses.filter(c => c.isShowOnWebsite === true);
      
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(c => 
          c.productTagList && c.productTagList.includes(selectedCategory)
        );
      }
      
      // Note: Level filtering not in API response - remove or add custom field
      if (selectedLevel !== 'All Levels' && selectedLevel !== 'All') {
        // Filter based on durationStr or another field if needed
        filtered = filtered.filter(c => {
          // Example: categorize by duration or another custom logic
          return true; // Implement your level logic here
        });
      }

      if (append) {
        setCourses(prev => [...prev, ...filtered]);
      } else {
        setCourses(filtered);
        // Update categories dynamically
        const allCourses = response.data;
        const cats = courseService.getCategories(allCourses);
        setCategories(cats);
      }

      setTotalRecords(response.recordsTotal);
      setHasMore(courses.length + filtered.length < response.recordsTotal);

    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchTerm, selectedCategory, selectedLevel, pageSize, courses.length]);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchCourses(false);
  }, []);

  /**
   * Search handler with debounce
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPageIndex(0);
        fetchCourses(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Filter change handler
   */
  useEffect(() => {
    setPageIndex(0);
    fetchCourses(false);
  }, [selectedCategory, selectedLevel]);

  /**
   * Load more handler
   */
  const handleLoadMore = () => {
    setPageIndex(prev => prev + 1);
    fetchCourses(true);
  };

  /**
   * Build course image URL
   */
  const getCourseImage = (course: Course) => {
    return ImageUtils.getCourseImage(course, cloudName);
  };

  /**
   * Format student count
   */
  const formatStudentCount = (count?: number) => {
    if (!count) return '0';
    return count.toLocaleString();
  };

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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
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
              
              <select 
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Button onClick={() => fetchCourses(false)} variant="secondary" size="sm" className="mt-2">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Grid */}
      {!isLoading && courses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.guId} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Course Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-brand-100 dark:from-primary-900/30 dark:to-brand-900/30">
                  <img 
                    src={getCourseImage(course)} 
                    alt={course.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = ImageUtils.buildCloudinaryUrl('', '', 480, 320);
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {course.paymentType === 'FREE' ? 'Free' : course.price || '$99'}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  {/* Tags/Categories from productTagList */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {course.productTagList && course.productTagList.length > 0 ? (
                      course.productTagList.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center justify-center h-6 px-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center justify-center h-6 px-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                        General
                      </span>
                    )}
                    {/* Course Type Badge */}
                    {course.isOnlineCourse && (
                      <span className="inline-flex items-center justify-center h-6 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                        Online
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {course.name}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {course.shortDescription || 'Learn valuable skills from expert instructors.'}
                  </p>

                  {/* Course Meta Info */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {course.durationStr && (
                      <span className="flex items-center mr-4">
                        <Clock className="h-4 w-4 mr-1" />
                        {course.durationStr}
                      </span>
                    )}
                    {course.dateUpdatedStr && (
                      <span className="flex items-center">
                        Updated {course.dateUpdatedStr}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.authorType === 'teacher' && course.authorId ? 'By Instructor' : 'By Organization'}
                    </span>
                    <Link to={`/courses/${course.guId}`}>
                      <Button size="sm" variant="secondary">
                        <Play className="h-4 w-4 mr-1" />
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Courses
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && courses.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-brand-600 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-primary-100 mb-6">
            Contact our team to discuss custom course development or specific learning needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="secondary" size="sm" className="px-6 py-2">
                Contact Us
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="px-6 py-2 bg-white text-primary-600 hover:bg-gray-100">
                Sign Up for Updates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### **Step 5: Create Pagination Component**

```typescript
// studioreact/src/components/ui/Pagination.tsx

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  isLoading = false,
}) => {
  // Calculate range of records being displayed
  const startRecord = currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalRecords);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage < 4) {
        // Near the start
        for (let i = 0; i < 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      } else if (currentPage > totalPages - 5) {
        // Near the end
        pages.push(0);
        pages.push('...');
        for (let i = totalPages - 5; i < totalPages; i++) pages.push(i);
      } else {
        // In the middle
        pages.push(0);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Results Summary */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing <span className="font-medium">{startRecord}</span> to{' '}
        <span className="font-medium">{endRecord}</span> of{' '}
        <span className="font-medium">{totalRecords}</span> results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0 || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className={`
                  min-w-[40px] px-3 py-1 rounded-lg font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        {/* Mobile Page Indicator */}
        <div className="sm:hidden px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage + 1} of {totalPages}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};
```

### **Step 6: Update Courses Page with Pagination**

Replace the "Load More" button section with proper pagination:

```typescript
// In CourseCatalogPage component, update the pagination section:

// Replace the "Load More" button (lines 731-753) with:

{/* Pagination */}
{!isLoading && courses.length > 0 && totalRecords > pageSize && (
  <Pagination
    currentPage={pageIndex}
    totalPages={Math.ceil(totalRecords / pageSize)}
    totalRecords={totalRecords}
    pageSize={pageSize}
    onPageChange={(page) => {
      setPageIndex(page);
      fetchCourses(false);
      // Scroll to top of course list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}
    isLoading={isLoading}
  />
)}
```

And update the `fetchCourses` function to use `pageIndex`:

```typescript
const fetchCourses = useCallback(async (append: boolean = false) => {
  try {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    // Use pageIndex for pagination instead of courses.length
    const start = pageIndex * pageSize;
    
    const response = await courseService.getCourses({
      start,
      max: pageSize,
      search: searchTerm || undefined,
      isShowAll: false,
    });

    const newCourses = response.data;
    
    // Filter for public display
    let filtered = newCourses.filter(c => c.isShowOnWebsite === true);
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(c => 
        c.productTagList && c.productTagList.includes(selectedCategory)
      );
    }

    // Set courses (don't append, replace with current page)
    setCourses(filtered);
    
    // Update categories on first load
    if (pageIndex === 0) {
      const cats = courseService.getCategories(response.data);
      setCategories(cats);
    }

    setTotalRecords(response.recordsTotal);

  } catch (err: any) {
    console.error('Failed to fetch courses:', err);
    setError(err.message || 'Failed to load courses');
  } finally {
    setIsLoading(false);
    setIsLoadingMore(false);
  }
}, [pageIndex, searchTerm, selectedCategory, selectedLevel, pageSize]);
```

### **Step 7: Update API Service Base**

```typescript
// studioreact/src/services/api.ts

import axios, { AxiosInstance } from 'axios';
import { environment } from '@/config/environment';

// Get auth token from storage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: environment.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

---

## **📊 Pagination Pattern Options**

You have two options for pagination implementation:

### **Option A: Traditional Pagination (Recommended for Course List)**
- ✅ Page numbers with First/Previous/Next/Last buttons
- ✅ Shows "X to Y of Z results"
- ✅ Users can jump to specific pages
- ✅ Better for large datasets
- ✅ More predictable navigation
- 📍 **Implementation:** Use the `Pagination` component from Step 5

---

## **🧪 Testing Checklist**

### **Core Functionality**
- [ ] Courses load on page mount
- [ ] Search filters courses by name/description
- [ ] Category dropdown filters correctly
- [ ] Level dropdown filters correctly
- [ ] Images load with Cloudinary URLs
- [ ] Placeholder shown for missing images
- [ ] Loading skeleton displays correctly
- [ ] Empty state shows when no results
- [ ] Error state shows on API failure

### **Pagination**
- [ ] Pagination controls display at bottom of course grid
- [ ] Page numbers show correctly (1, 2, 3, ...)
- [ ] Current page is highlighted
- [ ] Ellipsis (...) shows for large page counts
- [ ] "First Page" button works and disables on page 1
- [ ] "Previous" button works and disables on page 1
- [ ] "Next" button works and disables on last page
- [ ] "Last Page" button works and disables on last page
- [ ] Clicking specific page number navigates correctly
- [ ] Page scrolls to top when changing pages
- [ ] "Showing X to Y of Z results" displays correctly
- [ ] Pagination hides when results fit on one page
- [ ] Mobile shows compact "Page X of Y" instead of all numbers
- [ ] Pagination buttons disable during loading
- [ ] Search resets to page 1
- [ ] Filter changes reset to page 1

### **UI/UX**
- [ ] Dark mode styles work correctly for pagination
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Course detail navigation works
- [ ] Payment type badges display correctly
- [ ] Student count formats with commas
- [ ] Rating stars display correctly
- [ ] Search debounces properly (500ms)
- [ ] Hover states work on pagination buttons
- [ ] Focus states work for keyboard navigation

---

## **✅ Success Criteria**

Your implementation is complete when:

1. ✅ Courses load from real API (`/snode/icategory`)
2. ✅ Only courses with `isShowOnWebsite: true` are displayed
3. ✅ Category filter works using `productTagList`
4. ✅ Search filters courses by name/description
5. ✅ **Pagination UI displays with page numbers, First/Previous/Next/Last buttons**
6. ✅ **Page navigation works correctly (click page numbers, navigate between pages)**
7. ✅ **"Showing X to Y of Z results" displays accurate counts**
8. ✅ **Pagination resets to page 1 when filters/search changes**
9. ✅ **Page scrolls to top when navigating between pages**
10. ✅ Images display via Cloudinary with proper paths
11. ✅ Loading states show skeleton loaders
12. ✅ Empty/error states handle edge cases gracefully
13. ✅ Payment type badges show correctly (FREE, PAID, DONATION, EXTERNAL)
14. ✅ Course tags from `productTagList` display as badges
15. ✅ Online/offline course badge shows based on `isOnlineCourse`
16. ✅ Duration displays from `durationStr` field
17. ✅ Design matches original Tailwind mockup
18. ✅ Dark mode works throughout (including pagination)
19. ✅ Mobile responsive (1-2-3 column grid, compact pagination on mobile)
20. ✅ Navigation to course detail page works
21. ✅ All tests pass

---
