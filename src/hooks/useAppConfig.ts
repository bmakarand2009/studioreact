'use client';

import { useState, useEffect } from 'react';
import { create } from 'zustand';

interface AppConfig {
  layout: string;
  scheme: 'light' | 'dark' | 'auto';
  theme: string;
  navigation: 'vertical' | 'horizontal';
  toolbar: boolean;
  footer: boolean;
  rightPanel: boolean;
  leftPanel: boolean;
}

interface AppConfigStore {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: AppConfig = {
  layout: 'wajooba-admin',
  scheme: 'auto',
  theme: 'default',
  navigation: 'vertical',
  toolbar: true,
  footer: false,
  rightPanel: false,
  leftPanel: false,
};

const useAppConfigStore = create<AppConfigStore>((set) => ({
  config: defaultConfig,
  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates },
    })),
  resetConfig: () => set({ config: defaultConfig }),
}));

export const useAppConfig = () => {
  const { config, updateConfig, resetConfig } = useAppConfigStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load config from localStorage
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('app-config');
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          updateConfig(parsed);
        } catch (error) {
          console.warn('Failed to parse saved app config:', error);
        }
      }
    }
  }, [updateConfig]);

  // Save config to localStorage when it changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('app-config', JSON.stringify(config));
    }
  }, [config, mounted]);

  return {
    config,
    updateConfig,
    resetConfig,
    mounted,
  };
};
