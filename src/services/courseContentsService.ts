import { environment } from '@/config/environment';

export interface Section {
  guId: string;
  title: string;
  course: string;
  chapters?: Chapter[];
}

export interface Chapter {
  guId: string;
  title: string;
  section?: string;
  sequence?: number;
}

export interface Activity {
  _id?: string;
  name?: string;
  activityType?: 'content' | 'test' | 'form';
  shortDescription?: string;
  additionalInfo?: string;
  customFormGuId?: string;
  quizId?: string;
  paragraph?: string;
  imgUrl?: string;
  assetData?: any[];
  isTrackActivity?: boolean;
  isRepeatActivity?: boolean;
  isHideActivityOnToc?: boolean;
  isAllowUserToUploadFiles?: boolean;
  isDemoActivity?: boolean;
}

export interface ChapterBatch {
  guId?: string;
  courseBatchGuId: string;
  isPublished: boolean;
  dateSlug?: number;
}

class CourseContentsService {
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

  private buildHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async addSection(courseId: string, payload: { title: string; course: string; chapter?: any; isDefaultSection?: boolean }): Promise<Section> {
    const response = await fetch(`${this.baseUrl}/rest/itemCategory/${courseId}/section`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to add section: ${response.status}`);
    }
    return response.json();
  }

  async updateSection(section: Section): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/rest/itemCategory/${section.course}/section/${section.guId}`,
      {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(section),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update section: ${response.status}`);
    }
    return response.json();
  }

  async deleteSection(courseId: string, sectionGuId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/snode/icategory/${courseId}/section/${sectionGuId}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete section: ${response.status}`);
    }
  }

  async updateSectionSequence(courseId: string, data: { data: { guId: string; name: string; sequence: number; type: string }[] }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/snode/icategory/section/${courseId}/sequence`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update section sequence: ${response.status}`);
    }
    return response.json();
  }

  async addActivity(payload: {
    name: string;
    course: string;
    section: string;
    sequence: number;
    isNote?: boolean;
  }): Promise<{ studioChapter: Chapter }> {
    const response = await fetch(`${this.baseUrl}/edtest/activity`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to add activity: ${response.status}`);
    }
    return response.json();
  }

  async getActivity(courseId: string, chapterId: string): Promise<{ data: Activity }> {
    const response = await fetch(
      `${this.baseUrl}/edtest/activity?courseId=${courseId}&chapterId=${chapterId}`,
      { method: 'GET', headers: this.buildHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to get activity: ${response.status}`);
    }
    return response.json();
  }

  async submitActivity(payload: any): Promise<any> {
    const body = { ...payload, _id: null };
    const response = await fetch(`${this.baseUrl}/edtest/activity`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create activity: ${response.status}`);
    }
    return response.json();
  }

  async updateActivity(payload: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/edtest/activity/${payload._id}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update activity: ${response.status}`);
    }
    const result = await response.json();
    return result?.data ?? result;
  }

  async deleteActivity(activityId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/edtest/activity/${activityId}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete activity: ${response.status}`);
    }
  }

  async updateLesson(courseId: string, sectionGuId: string, chapterGuId: string, lesson: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/rest/itemCategory/${courseId}/section/${sectionGuId}/chapter/${chapterGuId}`,
      {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(lesson),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update lesson: ${response.status}`);
    }
    return response.json();
  }

  async updateLessonSequence(courseId: string, payload: { section: string; chapters: { guId: string; name: string; sequence: number }[] }): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/rest/itemCategory/${courseId}/section/${payload.section}/chapter/sequence`,
      {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update lesson sequence: ${response.status}`);
    }
    return response.json();
  }

  async getChapterBatch(chapterId: string): Promise<ChapterBatch[]> {
    const response = await fetch(`${this.baseUrl}/rest/courseChapter/${chapterId}/batch`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get chapter batch: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async publishChapterBatch(payload: { batchId: string; chapterId: string; isPublished?: boolean; dateSlug?: number }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/edtest/batch/update`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to publish chapter batch: ${response.status}`);
    }
    return response.json();
  }

  async getActivityAssetData(guId: string, productId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/edmedia/asset/?ownerId=${guId}&productType=course&productId=${productId}&isHomework=true`,
      { method: 'GET', headers: this.buildHeaders() }
    );
    if (!response.ok) return { data: [] };
    const data = await response.json();
    return data;
  }

  async getTestList(): Promise<{ data: any[] }> {
    const response = await fetch(`${this.baseUrl}/edtest/quiz/all`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });
    if (!response.ok) return { data: [] };
    return response.json();
  }
}

export const courseContentsService = new CourseContentsService();
