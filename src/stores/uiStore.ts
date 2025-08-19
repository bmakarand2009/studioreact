import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UIState, Notification, ModalState } from '@/types';

interface UIStore extends UIState {
  // Actions
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: false,
  notifications: [],
  modals: {},
};

// Custom storage that handles SSR
const createSSRStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.localStorage;
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
      },

      toggleSidebar: () => {
        const currentState = get().sidebarOpen;
        set({ sidebarOpen: !currentState });
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      addNotification: (notificationData) => {
        const id = Math.random().toString(36).substr(2, 9);
        const notification: Notification = {
          id,
          ...notificationData,
        };
        
        set((state) => ({
          notifications: [...state.notifications, notification],
        }));

        // Auto-remove notification after duration
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      openModal: (modalName: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalName]: true },
        }));
      },

      closeModal: (modalName: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalName]: false },
        }));
      },

      closeAllModals: () => {
        set({ modals: {} });
      },
    }),
    {
      name: 'wisely-ui',
      storage: createJSONStorage(() => createSSRStorage()),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
