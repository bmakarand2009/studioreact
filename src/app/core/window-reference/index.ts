/**
 * Window Reference Service
 * Manages window references, browser utilities, and cross-window communication
 */

export interface WindowReference {
  id: string;
  name: string;
  url: string;
  window: Window | null;
  isActive: boolean;
  createdAt: Date;
  lastAccessed: Date;
}

export interface WindowOptions {
  name?: string;
  features?: string;
  replace?: boolean;
  noopener?: boolean;
  noreferrer?: boolean;
}

export interface MessageData {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  target?: string;
}

class WindowReferenceService {
  private windowReferences: Map<string, WindowReference> = new Map();
  private messageListeners: Map<string, (_data: MessageData) => void> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    this.setupMessageListener();
    this.setupStorageListener();
    this.isInitialized = true;
  }

  /**
   * Setup message listener for cross-window communication
   */
  private setupMessageListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', (event: MessageEvent) => {
      this.handleMessage(event);
    });
  }

  /**
   * Setup storage listener for cross-tab communication
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'wisely-window-message') {
        try {
          const messageData: MessageData = JSON.parse(event.newValue || '{}');
          this.handleMessage({ data: messageData } as MessageEvent);
        } catch (error) {
          console.error('Error parsing storage message:', error);
        }
      }
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const messageData: MessageData = event.data;
      
      if (!messageData || !messageData.type) return;

      // Handle global messages
      if (!messageData.target || messageData.target === 'all') {
        this.broadcastMessage(messageData);
      }

      // Handle targeted messages
      if (messageData.target && messageData.target !== 'all') {
        const listener = this.messageListeners.get(messageData.target);
        if (listener) {
          listener(messageData);
        }
      }

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Broadcast message to all listeners
   */
  private broadcastMessage(messageData: MessageData): void {
    this.messageListeners.forEach((listener) => {
      try {
        listener(messageData);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  /**
   * Open a new window
   */
  openWindow(url: string, options: WindowOptions = {}): WindowReference | null {
    if (typeof window === 'undefined') return null;

    try {
      const {
        name = `window_${Date.now()}`,
        features = 'width=800,height=600,scrollbars=yes,resizable=yes',
        replace: _replace = false,
        noopener = true,
        noreferrer = true,
      } = options;

      // Build features string
      let featuresString = features;
      if (noopener) featuresString += ',noopener=yes';
      if (noreferrer) featuresString += ',noreferrer=yes';

      const newWindow = window.open(url, name, featuresString);
      
      if (!newWindow) {
        console.warn('Failed to open window. Popup might be blocked.');
        return null;
      }

      const windowRef: WindowReference = {
        id: name,
        name,
        url,
        window: newWindow,
        isActive: true,
        createdAt: new Date(),
        lastAccessed: new Date(),
      };

      this.windowReferences.set(name, windowRef);
      
      // Setup close detection
      this.setupCloseDetection(windowRef);

      return windowRef;
    } catch (error) {
      console.error('Error opening window:', error);
      return null;
    }
  }

  /**
   * Setup close detection for a window
   */
  private setupCloseDetection(windowRef: WindowReference): void {
    if (!windowRef.window) return;

    const checkClosed = () => {
      if (windowRef.window?.closed) {
        windowRef.isActive = false;
        windowRef.window = null;
        this.windowReferences.set(windowRef.id, windowRef);
      } else {
        setTimeout(checkClosed, 1000);
      }
    };

    setTimeout(checkClosed, 1000);
  }

  /**
   * Close a window
   */
  closeWindow(id: string): boolean {
    const windowRef = this.windowReferences.get(id);
    if (!windowRef || !windowRef.window) return false;

    try {
      windowRef.window.close();
      windowRef.isActive = false;
      windowRef.window = null;
      this.windowReferences.set(id, windowRef);
      return true;
    } catch (error) {
      console.error('Error closing window:', error);
      return false;
    }
  }

  /**
   * Focus a window
   */
  focusWindow(id: string): boolean {
    const windowRef = this.windowReferences.get(id);
    if (!windowRef || !windowRef.window) return false;

    try {
      windowRef.window.focus();
      windowRef.lastAccessed = new Date();
      this.windowReferences.set(id, windowRef);
      return true;
    } catch (error) {
      console.error('Error focusing window:', error);
      return false;
    }
  }

  /**
   * Get window reference by ID
   */
  getWindowReference(id: string): WindowReference | null {
    return this.windowReferences.get(id) || null;
  }

  /**
   * Get all window references
   */
  getAllWindowReferences(): WindowReference[] {
    return Array.from(this.windowReferences.values());
  }

  /**
   * Get active window references
   */
  getActiveWindowReferences(): WindowReference[] {
    return Array.from(this.windowReferences.values()).filter(ref => ref.isActive);
  }

  /**
   * Check if window is open
   */
  isWindowOpen(id: string): boolean {
    const windowRef = this.windowReferences.get(id);
    return !!(windowRef && windowRef.isActive && windowRef.window && !windowRef.window.closed);
  }

  /**
   * Send message to a specific window
   */
  sendMessage(targetId: string, messageData: Omit<MessageData, 'timestamp' | 'source'>): boolean {
    const windowRef = this.windowReferences.get(targetId);
    if (!windowRef || !windowRef.window) return false;

    try {
      const fullMessage: MessageData = {
        ...messageData,
        timestamp: Date.now(),
        source: 'wisely-react',
        target: targetId,
      };

      windowRef.window.postMessage(fullMessage, '*');
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Send message to all windows
   */
  broadcastToWindows(messageData: Omit<MessageData, 'timestamp' | 'source' | 'target'>): void {
    const activeWindows = this.getActiveWindowReferences();
    
    activeWindows.forEach(windowRef => {
      if (windowRef.window) {
        try {
          const fullMessage: MessageData = {
            ...messageData,
            timestamp: Date.now(),
            source: 'wisely-react',
            target: 'all',
          };

          windowRef.window.postMessage(fullMessage, '*');
        } catch (error) {
          console.error('Error broadcasting to window:', error);
        }
      }
    });
  }

  /**
   * Send message via localStorage (cross-tab communication)
   */
  sendMessageViaStorage(messageData: Omit<MessageData, 'timestamp' | 'source'>): void {
    if (typeof window === 'undefined') return;

    try {
      const fullMessage: MessageData = {
        ...messageData,
        timestamp: Date.now(),
        source: 'wisely-react',
      };

      localStorage.setItem('wisely-window-message', JSON.stringify(fullMessage));
      
      // Remove the message after a short delay
      setTimeout(() => {
        localStorage.removeItem('wisely-window-message');
      }, 100);
    } catch (error) {
      console.error('Error sending message via storage:', error);
    }
  }

  /**
   * Add message listener
   */
  addMessageListener(id: string, listener: (_data: MessageData) => void): void {
    this.messageListeners.set(id, listener);
  }

  /**
   * Remove message listener
   */
  removeMessageListener(id: string): boolean {
    return this.messageListeners.delete(id);
  }

  /**
   * Get window dimensions
   */
  getWindowDimensions(): { width: number; height: number } {
    if (typeof window === 'undefined') return { width: 0, height: 0 };

    return {
      width: window.innerWidth || document.documentElement.clientWidth || 0,
      height: window.innerHeight || document.documentElement.clientHeight || 0,
    };
  }

  /**
   * Get screen dimensions
   */
  getScreenDimensions(): { width: number; height: number } {
    if (typeof window === 'undefined' || !window.screen) {
      return { width: 0, height: 0 };
    }

    return {
      width: window.screen.width || 0,
      height: window.screen.height || 0,
    };
  }

  /**
   * Check if window is in focus
   */
  isWindowInFocus(): boolean {
    if (typeof window === 'undefined') return false;
    return document.hasFocus();
  }

  /**
   * Get window location
   */
  getWindowLocation(): Location | null {
    if (typeof window === 'undefined') return null;
    return window.location;
  }

  /**
   * Navigate to URL
   */
  navigateTo(url: string, replace = false): void {
    if (typeof window === 'undefined') return;

    if (replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Reload window
   */
  reloadWindow(): void {
    if (typeof window === 'undefined') return;
    window.location.reload();
  }

  /**
   * Go back in history
   */
  goBack(): void {
    if (typeof window === 'undefined') return;
    window.history.back();
  }

  /**
   * Go forward in history
   */
  goForward(): void {
    if (typeof window === 'undefined') return;
    window.history.forward();
  }

  /**
   * Get scroll position
   */
  getScrollPosition(): { x: number; y: number } {
    if (typeof window === 'undefined') return { x: 0, y: 0 };

    return {
      x: window.pageXOffset || document.documentElement.scrollLeft || 0,
      y: window.pageYOffset || document.documentElement.scrollTop || 0,
    };
  }

  /**
   * Scroll to position
   */
  scrollTo(x: number, y: number, behavior: 'auto' | 'smooth' = 'auto'): void {
    if (typeof window === 'undefined') return;

    window.scrollTo({
      left: x,
      top: y,
      behavior,
    });
  }

  /**
   * Scroll to top
   */
  scrollToTop(behavior: 'auto' | 'smooth' = 'smooth'): void {
    this.scrollTo(0, 0, behavior);
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Clean up all windows
   */
  cleanup(): void {
    this.windowReferences.forEach((windowRef) => {
      if (windowRef.window && !windowRef.window.closed) {
        try {
          windowRef.window.close();
        } catch (error) {
          console.error('Error closing window during cleanup:', error);
        }
      }
    });

    this.windowReferences.clear();
    this.messageListeners.clear();
  }
}

// Export singleton instance
export const windowReferenceService = new WindowReferenceService();
