import { environment } from '@/config/environment';
import { Course, CoursesResponse, CourseFilters } from '@/types/course';

class CourseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  private getAuthToken(): string | null {
    // Get token from cookie
    const nameEQ = 'accessToken=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Fetch courses with filtering and pagination
   * @param filters - Filter options for the course query
   * @returns Promise with courses response
   */
  async getCourses(filters: Partial<CourseFilters> = {}): Promise<CoursesResponse> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams({
      type: filters.type || 'service',
      include: filters.include || 'stats',
      draw: filters.draw || '1',
      start: (filters.start || 0).toString(),
      length: (filters.max || 50).toString(),
    });

    if (filters.search) {
      params.append('search', filters.search);
    }

    if (filters.isShowAll !== undefined) {
      params.append('isShowAll', filters.isShowAll.toString());
    }

    if (filters.isShowArchived !== undefined) {
      params.append('isShowArchived', filters.isShowArchived.toString());
    }

    const response = await fetch(
      `${this.baseUrl}/snode/icategory?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      throw new Error(`Failed to fetch courses: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get course details by ID
   * @param guId - Course unique identifier
   * @returns Promise with course details
   */
  async getCourseDetails(guId: string): Promise<Course> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${this.baseUrl}/snode/icategory/${guId}?include=details,template`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      throw new Error(`Failed to fetch course details: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get public courses (no auth required)
   * @param tenantId - Tenant identifier
   * @param signal - Optional AbortSignal to cancel the request (e.g. on effect cleanup)
   * @returns Promise with public courses
   */
  async getPublicCourses(tenantId: string, signal?: AbortSignal): Promise<Course[]> {
    const response = await fetch(
      `${this.baseUrl}/snode/icategory/public?tid=${tenantId}&type=service`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch public courses: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get public course detail with memberships (no auth required).
   * API expects course URL handle (slug), not guId: snode/pcourse/{tenantId}/{courseUrlHandle}
   * @param tenantId - Tenant identifier
   * @param courseUrlHandle - Course URL handle (e.g. "my-course"), not guId
   * @returns Promise with { data: course with memberships, template?, ... }
   */
  async getPublicCourseDetail(tenantId: string, courseUrlHandle: string, signal?: AbortSignal): Promise<{
    data: Course & {
      memberships?: Array<{
        guId: string;
        price?: number;
        currency?: string;
        membershipType?: string;
        billingFrequency?: string;
        [key: string]: unknown;
      }>;
      products?: unknown[];
      teacher?: { fullName?: string };
      template?: { unhtml?: string };
      wemail?: {
        author?: { displayTitle?: string; designation?: string; description?: string };
      };
    };
  }> {
    const response = await fetch(
      `${this.baseUrl}/snode/pcourse/${tenantId}/${encodeURIComponent(courseUrlHandle)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch course detail: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Toggle course visibility on website
   * @param courseId - Course unique identifier
   * @param isVisible - Whether course should be visible
   */
  async toggleCourseVisibility(courseId: string, isVisible: boolean): Promise<void> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${this.baseUrl}/snode/icategory/${courseId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isShowOnWebsite: isVisible }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update course visibility');
    }
  }

  /**
   * Get categories dynamically from productTagList
   * @param courses - Array of courses
   * @returns Array of unique categories
   */
  getCategories(courses: Course[]): string[] {
    const categories = new Set<string>();
    courses.forEach(course => {
      if (course.productTagList && course.productTagList.length > 0) {
        course.productTagList.forEach(tag => categories.add(tag));
      }
    });
    return ['All', ...Array.from(categories)];
  }
}

export const courseService = new CourseService();
