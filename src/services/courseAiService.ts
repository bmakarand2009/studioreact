import { environment } from '@/config/environment';

type AiPromptTarget = 'name' | 'shortDescription' | 'longDescription';

export interface AiCourseContext {
  courseName: string;
  shortDescription: string;
  longDescription: string;
  authorName: string;
  durationText: string;
  priceText: string;
}

interface AiPromptResponse {
  result: string;
}

interface FlyerPromptResponse {
  sessionId: string;
}

interface FlyerStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: string;
}

/**
 * Course AI Service
 *
 * Provides a thin wrapper around the AI template endpoints used by the
 * Angular admin app. Until the real endpoints are available in the React
 * admin, the methods fall back to lightweight mock implementations so the
 * rest of the flow can be exercised without breaking.
 */
class CourseAiService {
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

  /**
   * Send a generic AI prompt for a course field.
   */
  async generateField(
    target: AiPromptTarget,
    context: AiCourseContext,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/snode/ai/course/prompt`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          target,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI prompt failed with status ${response.status}`);
      }

      const data: AiPromptResponse = await response.json();
      if (data?.result) {
        return data.result;
      }
    } catch (error) {
      console.warn('[CourseAiService] Falling back to mock AI response', error);
    }

    // Mock fallback if API is unavailable
    switch (target) {
      case 'name':
        return 'Inspiring Learning Journey';
      case 'shortDescription':
        return 'Discover a transformative learning experience packed with engaging lessons, hands-on projects, and expert guidance.';
      case 'longDescription':
        return `Unlock a comprehensive journey into the topic with guided lessons, real-world practice, and supportive resources. 

What you will learn:
• Core fundamentals presented in an easy-to-digest format
• Actionable projects that reinforce every concept
• Tips, templates, and workflows professionals rely on every day

Join us to gain confidence, sharpen your skills, and create meaningful results from day one.`;
      default:
        return '';
    }
  }

  /**
   * Request AI flyer generation for the sales page.
   * Returns a sessionId that can be polled for completion.
   */
  async requestFlyerGeneration(context: AiCourseContext): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/snode/ai/course/flyer`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        throw new Error(`AI flyer prompt failed with status ${response.status}`);
      }

      const data: FlyerPromptResponse = await response.json();
      if (data?.sessionId) {
        return data.sessionId;
      }
    } catch (error) {
      console.warn('[CourseAiService] Falling back to mock flyer response', error);
    }

    // Mock session ID when endpoint is unavailable
    return `mock-session-${Date.now()}`;
  }

  /**
   * Poll the AI flyer job status. Returns HTML when complete.
   */
  async checkFlyerStatus(sessionId: string): Promise<FlyerStatusResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/snode/ai/course/flyer/${sessionId}`,
        {
          method: 'GET',
          headers: this.buildHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`AI flyer status failed with status ${response.status}`);
      }

      const data: FlyerStatusResponse = await response.json();
      if (data) {
        return data;
      }
    } catch (error) {
      console.warn('[CourseAiService] Falling back to mock flyer status', error);
    }

    // Mock completion payload
    return {
      status: 'completed',
      result: `<html><body style="font-family: Inter, sans-serif; padding: 24px;">
  <section style="max-width: 640px; margin: 0 auto; text-align: center;">
    <h1 style="font-size: 32px; margin-bottom: 12px;">Inspiring Course Headline</h1>
    <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
      An engaging, well-structured course designed to help learners grow with confidence.
    </p>
    <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 24px;">
      <div>
        <h3 style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em;">Duration</h3>
        <p style="font-size: 18px; font-weight: 600;">Self-paced</p>
      </div>
      <div>
        <h3 style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em;">Instructor</h3>
        <p style="font-size: 18px; font-weight: 600;">Expert Instructor</p>
      </div>
    </div>
    <a href="#" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 24px; background: #2563eb; color: #fff; border-radius: 9999px; text-decoration: none;">
      Reserve Your Spot
    </a>
  </section>
</body></html>`,
    };
  }
}

export const courseAiService = new CourseAiService();

