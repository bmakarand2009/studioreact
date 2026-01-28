import { useCallback, useEffect, useMemo, useState } from 'react';
import { environment } from '@/config/environment';
import { useToast } from '@/components/ui/ToastProvider';
import {
  AISidebarState,
  ProductDetails,
  AIResultEvent,
  ChatMessage,
  ChatMessageEvent,
} from '@/components/ai-sidebar/types';

const getAuthToken = () => {
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
};

export interface UseAISidebarServiceResult {
  state: AISidebarState;
  set: (targetField: string, features?: string[], productDetails?: ProductDetails) => void;
  open: () => void;
  close: () => void;
  setAndOpen: (targetField: string, features?: string[], productDetails?: ProductDetails) => void;
  updateProductDetails: (productDetails: ProductDetails) => void;
  applyAI: (event: { field: string; value: string }) => void;
  pushChatMessage: (message: ChatMessageEvent) => void;
  generatePromptForTarget: (targetField: string) => string;
  sendAiPrompt: (message: string, features: string[], data?: any) => Promise<any>;
  sendFlyerPrompt: (message: string, features: string[], data?: any) => Promise<any>;
  checkAIStatus: (sessionId: string) => Promise<any>;
  getCurrentSessionId: () => string | undefined;
  setCurrentSessionId: (sessionId: string) => void;
  getDesignerSessionId: () => string | undefined;
  setDesignerSessionId: (sessionId: string) => void;
  clearAllSessionIds: () => void;
  // Event emitters (using callbacks for React)
  onAIResult: (callback: (result: AIResultEvent) => void) => () => void;
  onAIClose: (callback: () => void) => () => void;
  onChatMessage: (callback: (message: ChatMessageEvent) => void) => () => void;
}

export const useAISidebarService = (): UseAISidebarServiceResult => {
  const toast = useToast();
  const [state, setState] = useState<AISidebarState>({
    isOpen: false,
    targetField: null,
    features: ['course'],
    isDesignerMode: false,
    productDetails: undefined,
  });

  const [currentSessionId, setCurrentSessionIdState] = useState<string | undefined>();
  const [designerSessionId, setDesignerSessionIdState] = useState<string | undefined>();
  
  // Event listeners
  const aiResultListeners = useMemo(() => new Set<(result: AIResultEvent) => void>(), []);
  const aiCloseListeners = useMemo(() => new Set<() => void>(), []);
  const chatMessageListeners = useMemo(() => new Set<(message: ChatMessageEvent) => void>(), []);

  const set = useCallback(
    (targetField: string, features: string[] = ['course'], productDetails?: ProductDetails) => {
      setState((prev) => {
        const isDesignerMode = features.includes('designer');
        return {
          ...prev,
          targetField,
          features,
          isDesignerMode,
          productDetails: productDetails !== undefined ? productDetails : prev.productDetails,
        };
      });
    },
    [],
  );

  const open = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    aiCloseListeners.forEach((listener) => listener());
  }, [aiCloseListeners]);

  const setAndOpen = useCallback(
    (targetField: string, features: string[] = ['course'], productDetails?: ProductDetails) => {
      set(targetField, features, productDetails);
      open();
    },
    [set, open],
  );

  const updateProductDetails = useCallback((productDetails: ProductDetails) => {
    setState((prev) => ({
      ...prev,
      productDetails: { ...prev.productDetails, ...productDetails },
    }));
  }, []);

  const applyAI = useCallback(
    (event: { field: string; value: string }) => {
      const aiResultEvent: AIResultEvent = {
        ...event,
        targetField: state.targetField || undefined,
      };
      aiResultListeners.forEach((listener) => listener(aiResultEvent));
    },
    [state.targetField, aiResultListeners],
  );

  const pushChatMessage = useCallback(
    (message: ChatMessageEvent) => {
      chatMessageListeners.forEach((listener) => listener(message));
    },
    [chatMessageListeners],
  );

  const generatePromptForTarget = useCallback(
    (targetField: string): string => {
      const productDetails = state.productDetails;
      if (!productDetails) {
        return `Create content for ${targetField}.`;
      }

      if (productDetails.type === 'event') {
        if (targetField === 'name') {
          const eventType = productDetails.eventType || 'event';
          const authorName = productDetails.authorName || 'Host';
          return `Create a compelling and memorable name for this ${eventType}. 

Requirements:
- Maximum 60 characters
- Catchy and memorable
- Clear and descriptive
- Professional yet engaging
- Avoid generic terms
- Include relevant keywords

Generate a name that captures attention and clearly communicates what the event is about.`;
        } else if (targetField === 'shortDescription') {
          const eventName = productDetails.eventName || 'Event';
          const eventType = productDetails.eventType || 'event';
          return `Create a compelling short description for "${eventName}" - a ${eventType}. 

Requirements:
- Maximum 255 characters
- No hard stops or forced word breaks
- Engaging and informative
- Include key benefits and highlights
- Use natural language flow
- Focus on what makes this event special

Generate a concise, engaging description that captures attention and encourages participation.`;
        }
      } else if (productDetails.type === 'course') {
        if (targetField === 'name') {
          const authorName = productDetails.authorName || 'Organization';
          return `Create a compelling and memorable name for this course by ${authorName}. 

Requirements:
- Maximum 60 characters
- Catchy and memorable
- Clear and descriptive
- Professional yet engaging
- Avoid generic terms
- Include relevant keywords
- Focus on learning outcomes

Generate a name that captures attention and clearly communicates what students will learn.`;
        } else if (targetField === 'shortDescription') {
          const courseName = productDetails.courseName || 'Course';
          const authorName = productDetails.authorName || 'Organization';
          return `Create a compelling short description for "${courseName}" - a course by ${authorName}. 

Requirements:
- Maximum 255 characters
- No hard stops or forced word breaks
- Engaging and informative
- Include key benefits and learning outcomes
- Use natural language flow
- Focus on what makes this course valuable
- Highlight skills students will gain

Generate a concise, engaging description that captures attention and encourages enrollment.`;
        }
      } else if (productDetails.type === 'product' || productDetails.type === 'merchandise') {
        if (targetField === 'name') {
          const authorName = productDetails.authorName || 'Brand';
          const productType = productDetails.productType || 'product';
          return `Create a compelling and memorable name for this ${productType} by ${authorName}. 

Requirements:
- Maximum 60 characters
- Catchy and memorable
- Clear and descriptive
- Professional yet engaging
- Avoid generic terms
- Include relevant keywords
- Focus on product benefits

Generate a name that captures attention and clearly communicates what the product offers.`;
        } else if (targetField === 'shortDescription') {
          const productName = productDetails.productName || productDetails.name || 'Product';
          const authorName = productDetails.authorName || 'Brand';
          return `Create a compelling short description for "${productName}" - a product by ${authorName}. 

Requirements:
- Maximum 255 characters
- No hard stops or forced word breaks
- Engaging and informative
- Include key benefits and features
- Use natural language flow
- Focus on what makes this product special
- Highlight value proposition

Generate a concise, engaging description that captures attention and encourages purchase.`;
        }
      }

      return `Create compelling content for ${targetField}.`;
    },
    [state.productDetails],
  );

  const sendAiPrompt = useCallback(
    async (message: string, features: string[], data?: any) => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const payload: any = { message, features };
        if (data) {
          payload.data = data;
        }

        // Determine which session ID to use
        let sessionIdToUse;
        if (features.includes('designer')) {
          sessionIdToUse = designerSessionId;
        } else {
          sessionIdToUse = currentSessionId;
        }

        if (sessionIdToUse) {
          payload.sessionId = sessionIdToUse;
        }

        const response = await fetch(`${environment.api.baseUrl}/aimgr/chatbot/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to send AI prompt');
        }

        const result = await response.json();

        // Store session ID from response
        if (result?.sessionId) {
          if (features.includes('designer')) {
            setDesignerSessionIdState(result.sessionId);
          } else {
            setCurrentSessionIdState(result.sessionId);
          }
        }

        return result;
      } catch (error) {
        console.error(error);
        toast.error('Unable to get AI response. Please try again.');
        throw error;
      }
    },
    [currentSessionId, designerSessionId, toast],
  );

  const sendFlyerPrompt = useCallback(
    async (message: string, features: string[], data?: any) => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const payload: any = { message, features };
        if (data) {
          payload.data = data;
        }

        // Always use designer session ID for flyer generation
        if (designerSessionId) {
          payload.sessionId = designerSessionId;
        }

        const response = await fetch(`${environment.api.baseUrl}/aimgr/chatbot/flyer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to send flyer prompt');
        }

        const result = await response.json();

        // Store session ID from response
        if (result?.sessionId) {
          setDesignerSessionIdState(result.sessionId);
        }

        return result;
      } catch (error) {
        console.error(error);
        toast.error('Unable to generate flyer. Please try again.');
        throw error;
      }
    },
    [designerSessionId, toast],
  );

  const checkAIStatus = useCallback(
    async (sessionId: string) => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${environment.api.baseUrl}/aimgr/chatbot/status/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check AI status');
        }

        return await response.json();
      } catch (error) {
        console.error(error);
        toast.error('Unable to check AI status. Please try again.');
        throw error;
      }
    },
    [toast],
  );

  const getCurrentSessionId = useCallback(() => currentSessionId, [currentSessionId]);
  const setCurrentSessionId = useCallback((sessionId: string) => {
    setCurrentSessionIdState(sessionId);
  }, []);
  const getDesignerSessionId = useCallback(() => designerSessionId, [designerSessionId]);
  const setDesignerSessionId = useCallback((sessionId: string) => {
    setDesignerSessionIdState(sessionId);
  }, []);
  const clearAllSessionIds = useCallback(() => {
    setCurrentSessionIdState(undefined);
    setDesignerSessionIdState(undefined);
  }, []);

  // Event subscription methods
  const onAIResult = useCallback(
    (callback: (result: AIResultEvent) => void) => {
      aiResultListeners.add(callback);
      return () => {
        aiResultListeners.delete(callback);
      };
    },
    [aiResultListeners],
  );

  const onAIClose = useCallback(
    (callback: () => void) => {
      aiCloseListeners.add(callback);
      return () => {
        aiCloseListeners.delete(callback);
      };
    },
    [aiCloseListeners],
  );

  const onChatMessage = useCallback(
    (callback: (message: ChatMessageEvent) => void) => {
      chatMessageListeners.add(callback);
      return () => {
        chatMessageListeners.delete(callback);
      };
    },
    [chatMessageListeners],
  );

  return {
    state,
    set,
    open,
    close,
    setAndOpen,
    updateProductDetails,
    applyAI,
    pushChatMessage,
    generatePromptForTarget,
    sendAiPrompt,
    sendFlyerPrompt,
    checkAIStatus,
    getCurrentSessionId,
    setCurrentSessionId,
    getDesignerSessionId,
    setDesignerSessionId,
    clearAllSessionIds,
    onAIResult,
    onAIClose,
    onChatMessage,
  };
};
