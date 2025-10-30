import { environment } from '@/config/environment';

export interface CourseListItem {
  id: string;
  name: string;
  shortDescription: string;
  paymentType: 'PAID' | 'FREE';
  isShowOnWebsite: boolean;
  image1?: string;
  categoryType?: string;
  dateCreated?: string;
}

export interface CourseListResponse {
  data: CourseListItem[];
  recordsTotal: number;
  recordsFiltered: number;
}

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

  async getCourses(start: number = 0, max: number = 50): Promise<CourseListResponse> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${this.baseUrl}/snode/icategory?start=${start}&max=${max}`,
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

  async toggleCourseVisibility(courseId: string, isVisible: boolean): Promise<void> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // This endpoint might need to be adjusted based on your actual API
    const response = await fetch(
      `${this.baseUrl}/snode/icategory/${courseId}`,
      {
        method: 'PATCH',
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
}

export const courseService = new CourseService();
