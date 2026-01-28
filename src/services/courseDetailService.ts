import { environment } from '@/config/environment';

export interface StaffMember {
  guId: string;
  name: string;
  email?: string;
}

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface CourseTemplatePayload {
  courseGuId: string;
  name: string;
  orgId: string;
  url: string;
  unhtml: string;
  unjson: Record<string, any>;
  templateId?: string;
}

export interface CourseSavePayload extends Record<string, any> {
  productCategory?: string[];
  productTagList?: string[];
  teacherId?: string | null;
  authorId?: string | null;
  authorType?: 'teacher' | 'organization';
  isTeacher?: boolean;
  durationStr?: string;
  image1?: string;
  shortDescription?: string;
  longDescription?: string;
  name?: string;
  guId?: string;
}

class CourseDetailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  private getAuthToken(): string | null {
    const nameEQ = 'accessToken=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private buildHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async getCourseDetail(guId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/snode/icategory/${guId}?include=details,template`,
      {
        method: 'GET',
        headers: this.buildHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to load course ${guId}: ${response.status}`);
    }

    return response.json();
  }

  async createCourse(payload: CourseSavePayload): Promise<any> {
    const response = await fetch(`${this.baseUrl}/snode/icategory`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create course: ${response.status}`);
    }

    return response.json();
  }

  async updateCourse(guId: string, payload: CourseSavePayload): Promise<any> {
    const response = await fetch(`${this.baseUrl}/snode/icategory/${guId}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update course: ${response.status}`);
    }

    return response.json();
  }

  async getStaffList(): Promise<StaffMember[]> {
    const response = await fetch(
      `${this.baseUrl}/snode/contact?start=0&max=200&ctype=staff`,
      {
        method: 'GET',
        headers: this.buildHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to load staff: ${response.status}`);
    }

    const data = await response.json();
    const staffList = data?.contactList || data?.data || data || [];
    return staffList.map((staff: any) => ({
      guId: staff?.guId || staff?.id,
      name:
        staff?.name ||
        [staff?.firstName, staff?.lastName].filter(Boolean).join(' ') ||
        'Unnamed Staff',
      email: staff?.email,
    }));
  }

  async getCategories(tenantId: string): Promise<CourseCategory[]> {
    const response = await fetch(
      `${this.baseUrl}/rest/productCategory?tid=${tenantId}`,
      {
        method: 'GET',
        headers: this.buildHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to load categories: ${response.status}`);
    }

    const data = await response.json();
    const rawCategories =
      data?.data ||
      data?.productCategoryList ||
      data?.categories ||
      data ||
      [];

    return rawCategories.map((category: any) => ({
      id: category?.id || category?.guId || category?.categoryId,
      name: category?.name || category?.title || 'Unnamed Category',
      description: category?.description || '',
    }));
  }

  async createCategory(
    tenantId: string,
    payload: { name: string; description?: string },
  ): Promise<CourseCategory> {
    const response = await fetch(
      `${this.baseUrl}/rest/productCategory?tid=${tenantId}`,
      {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to create category: ${response.status}`);
    }

    const data = await response.json();
    const category = data?.data || data;

    return {
      id: category?.id || category?.guId,
      name: category?.name || payload.name,
      description: category?.description || payload.description,
    };
  }

  async saveTemplate(payload: CourseTemplatePayload): Promise<any> {
    const endpoint = payload.templateId
      ? `${this.baseUrl}/stemplate/page/${payload.courseGuId}`
      : `${this.baseUrl}/stemplate/page`;

    const response = await fetch(endpoint, {
      method: payload.templateId ? 'PUT' : 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        guId: payload.courseGuId,
        name: payload.name,
        orgId: payload.orgId,
        url: payload.url,
        unhtml: payload.unhtml,
        unjson: payload.unjson,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save template: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete a course (soft delete - sets isDeleted flag)
   */
  async deleteCourse(guId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/rest/itemCategory/${guId}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to delete course: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Restore a deleted course (undo delete - sets isDeleted to false)
   */
  async restoreCourse(guId: string, payload: { isDeleted: boolean }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/rest/itemCategory/${guId}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to restore course: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update email settings for a course
   */
  async updateEmail(guId: string, payload: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/snode/icategory/${guId}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to update email settings: ${response.status}`);
    }

    return response.json();
  }
}

export const courseDetailService = new CourseDetailService();