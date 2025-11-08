import { environment } from '@/config/environment';

export type EventAiTarget = 'name' | 'shortDescription' | 'longDescription';

export interface EventAiContext {
  eventName: string;
  shortDescription: string;
  longDescription: string;
  authorName: string;
  eventType: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
  eventPrice: string;
}

interface AiPromptResponse {
  result?: string;
  sessionId?: string;
}

interface FlyerPromptResponse {
  sessionId?: string;
}

interface FlyerStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: string;
}

class EventAiService {
  private readonly baseUrl: string;
  private designerSessionId?: string;
  private conversationSessionId?: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const nameEQ = 'accessToken=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i += 1) {
      let c = cookies[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async generateField(target: EventAiTarget, context: EventAiContext): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/aimgr/chatbot/chat`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          message: this.buildPrompt(target, context),
          features: ['event'],
          data: context,
          sessionId: this.conversationSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Event AI prompt failed with status ${response.status}`);
      }

      const data: AiPromptResponse = await response.json();
      if (data?.sessionId) {
        this.conversationSessionId = data.sessionId;
      }
      if (data?.result) {
        return data.result.trim();
      }
    } catch (error) {
      console.warn('[EventAiService] Falling back to mock response', error);
    }

    return this.getMockResponse(target, context);
  }

  async requestFlyerGeneration(context: EventAiContext): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/aimgr/chatbot/flyer`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          message: 'Generate an event flyer',
          features: ['event', 'designer'],
          data: context,
          sessionId: this.designerSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Event flyer prompt failed with status ${response.status}`);
      }

      const data: FlyerPromptResponse = await response.json();
      if (data?.sessionId) {
        this.designerSessionId = data.sessionId;
        return data.sessionId;
      }
    } catch (error) {
      console.warn('[EventAiService] Falling back to mock flyer session', error);
    }

    const mockSession = `event-flyer-${Date.now()}`;
    this.designerSessionId = mockSession;
    return mockSession;
  }

  async checkFlyerStatus(sessionId: string): Promise<FlyerStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/aimgr/chatbot/status/${sessionId}`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Event flyer status failed with status ${response.status}`);
      }

      const data: FlyerStatusResponse = await response.json();
      if (data) {
        return data;
      }
    } catch (error) {
      console.warn('[EventAiService] Falling back to mock flyer status', error);
    }

    return {
      status: 'completed',
      result: this.getMockFlyerHtml(),
    };
  }

  clearSessions(): void {
    this.designerSessionId = undefined;
    this.conversationSessionId = undefined;
  }

  private buildPrompt(target: EventAiTarget, context: EventAiContext): string {
    switch (target) {
      case 'name':
        return `Suggest a compelling event name for the following event details:\nName: ${context.eventName}\nDescription: ${context.shortDescription}\nEvent Type: ${context.eventType}`;
      case 'shortDescription':
        return `Create a short, enticing event description (max 255 characters).\nEvent: ${context.eventName}\nType: ${context.eventType}\nLocation: ${context.eventLocation}\nDate: ${context.eventDate}\nTime: ${context.eventTime}`;
      case 'longDescription':
        return `Write a long-form marketing description for the event below. Include key highlights, who it's for, and why to attend.\nEvent: ${context.eventName}\nShort Description: ${context.shortDescription}\nType: ${context.eventType}\nLocation: ${context.eventLocation}\nDate: ${context.eventDate}\nTime: ${context.eventTime}\nPrice: ${context.eventPrice}`;
      default:
        return context.shortDescription || context.eventName;
    }
  }

  private getMockResponse(target: EventAiTarget, context: EventAiContext): string {
    switch (target) {
      case 'name':
        return 'Signature Spotlight Experience';
      case 'shortDescription':
        return 'Join us for an energizing session packed with expert instruction, hands-on practice, and community connections.';
      case 'longDescription':
        return `Get ready for ${context.eventName}, a dynamic ${context.eventType} designed to ignite ideas and inspire action.\n\nHighlights:\n• Engaging instructors who guide every step\n• Practical takeaways you can put to work immediately\n• A welcoming space to connect with peers and grow together\n\nReserve your spot today and experience the momentum for yourself.`;
      default:
        return context.shortDescription;
    }
  }

  private getMockFlyerHtml(): string {
    return `<html><body style="font-family: 'Inter', sans-serif; padding: 24px; background: #f8fafc;">
  <section style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);">
    <h1 style="font-size: 36px; margin-bottom: 16px; color: #0f172a;">Signature Spotlight Experience</h1>
    <p style="font-size: 18px; color: #475569; margin-bottom: 24px; line-height: 1.6;">
      Elevate your skills with an immersive learning experience featuring inspiring mentors, collaborative workshops, and actionable insights.
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px;">
      <div style="flex: 1 1 160px;">
        <p style="text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em; font-size: 12px; margin-bottom: 4px;">Date</p>
        <p style="font-size: 18px; font-weight: 600; color: #0f172a;">Coming Soon</p>
      </div>
      <div style="flex: 1 1 160px;">
        <p style="text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em; font-size: 12px; margin-bottom: 4px;">Location</p>
        <p style="font-size: 18px; font-weight: 600; color: #0f172a;">In-Person & Online</p>
      </div>
    </div>
    <a href="#" style="display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; background: linear-gradient(90deg, #2563eb, #7c3aed); color: #ffffff; border-radius: 9999px; text-decoration: none; font-weight: 600;">
      Reserve Your Spot
    </a>
  </section>
</body></html>`;
  }
}

export const eventAiService = new EventAiService();
export default eventAiService;
