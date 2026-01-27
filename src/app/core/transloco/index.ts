/**
 * Transloco Service
 * Handles internationalization, localization, and language management
 */

import { STORAGE_KEYS } from '../app-constants';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: string;
}

export interface Translation {
  [key: string]: string | Translation;
}

export interface TranslationSet {
  language: string;
  namespace: string;
  translations: Translation;
  version: string;
  lastUpdated: Date;
}

export interface TranslationOptions {
  namespace?: string;
  fallback?: string;
  interpolation?: Record<string, any>;
}

class TranslocoService {
  private currentLanguage: string = 'en';
  private fallbackLanguage: string = 'en';
  private availableLanguages: Language[] = [];
  private translations: Map<string, Translation> = new Map();
  private namespaces: Map<string, Translation> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      // Load available languages
      await this.loadAvailableLanguages();
      
      // Set current language from storage or default
      const storedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (storedLanguage && this.isLanguageAvailable(storedLanguage)) {
        this.currentLanguage = storedLanguage;
      } else {
        this.currentLanguage = this.detectLanguage();
      }

      // Load current language translations
      await this.loadLanguage(this.currentLanguage);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing transloco service:', error);
    }
  }

  /**
   * Load available languages
   */
  private async loadAvailableLanguages(): Promise<void> {
    // Default languages
    this.availableLanguages = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        direction: 'ltr',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'HH:mm',
        currency: 'USD',
        numberFormat: 'en-US',
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        numberFormat: 'es-ES',
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        numberFormat: 'fr-FR',
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        numberFormat: 'de-DE',
      },
      {
        code: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        flag: '🇮🇹',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        numberFormat: 'it-IT',
      },
      {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇵🇹',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        numberFormat: 'pt-PT',
      },
      {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        flag: '🇷🇺',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm',
        currency: 'RUB',
        numberFormat: 'ru-RU',
      },
      {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        flag: '🇨🇳',
        direction: 'ltr',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        currency: 'CNY',
        numberFormat: 'zh-CN',
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        direction: 'ltr',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        currency: 'JPY',
        numberFormat: 'ja-JP',
      },
      {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        flag: '🇰🇷',
        direction: 'ltr',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        currency: 'KRW',
        numberFormat: 'ko-KR',
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇸🇦',
        direction: 'rtl',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'SAR',
        numberFormat: 'ar-SA',
      },
      {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        flag: '🇮🇳',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'INR',
        numberFormat: 'hi-IN',
      },
    ];
  }

  /**
   * Detect user's preferred language
   */
  private detectLanguage(): string {
    if (typeof navigator === 'undefined') return this.fallbackLanguage;

    // Check navigator.languages
    if (navigator.languages && navigator.languages.length > 0) {
      for (const lang of navigator.languages) {
        const code = lang.split('-')[0];
        if (this.isLanguageAvailable(code)) {
          return code;
        }
      }
    }

    // Check navigator.language
    if (navigator.language) {
      const code = navigator.language.split('-')[0];
      if (this.isLanguageAvailable(code)) {
        return code;
      }
    }

    return this.fallbackLanguage;
  }

  /**
   * Check if language is available
   */
  private isLanguageAvailable(code: string): boolean {
    return this.availableLanguages.some(lang => lang.code === code);
  }

  /**
   * Load language translations
   */
  private async loadLanguage(languageCode: string): Promise<void> {
    try {
      // Load common translations
      const commonTranslations = await this.loadTranslationFile(languageCode, 'common');
      this.translations.set(languageCode, commonTranslations);

      // Load namespace translations
      await this.loadNamespace(languageCode, 'ui');
      await this.loadNamespace(languageCode, 'errors');
      await this.loadNamespace(languageCode, 'validation');
    } catch (error) {
      console.error(`Error loading language ${languageCode}:`, error);
      
      // Fallback to English if loading fails
      if (languageCode !== this.fallbackLanguage) {
        await this.loadLanguage(this.fallbackLanguage);
      }
    }
  }

  /**
   * Load translation file
   */
  private async loadTranslationFile(language: string, namespace: string): Promise<Translation> {
    try {
      // Try to load from API first
      const response = await fetch(`/api/translations/${language}/${namespace}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed to load translations from API for ${language}/${namespace}`);
    }

    // Fallback to static translations
    return this.getStaticTranslations(language, namespace);
  }

  /**
   * Load namespace translations
   */
  private async loadNamespace(languageCode: string, namespace: string): Promise<void> {
    try {
      const translations = await this.loadTranslationFile(languageCode, namespace);
      this.namespaces.set(`${languageCode}:${namespace}`, translations);
    } catch (error) {
      console.error(`Error loading namespace ${namespace} for language ${languageCode}:`, error);
    }
  }

  /**
   * Get static translations (fallback)
   */
  private getStaticTranslations(_language: string, _namespace: string): Translation {
    // This would contain static translations for each language/namespace
    // For now, return empty object - in production, you'd have these pre-loaded
    return {};
  }

  /**
   * Set current language
   */
  async setLanguage(languageCode: string): Promise<void> {
    if (!this.isLanguageAvailable(languageCode)) {
      throw new Error(`Language ${languageCode} is not available`);
    }

    if (this.currentLanguage === languageCode) return;

    this.currentLanguage = languageCode;
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);

    // Load new language translations
    await this.loadLanguage(languageCode);

    // Update document direction
    this.updateDocumentDirection();

    // Trigger language change event
    this.triggerLanguageChange();
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get current language info
   */
  getCurrentLanguageInfo(): Language | null {
    return this.availableLanguages.find(lang => lang.code === this.currentLanguage) || null;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Language[] {
    return [...this.availableLanguages];
  }

  /**
   * Translate key
   */
  translate(key: string, options: TranslationOptions = {}): string {
    const {
      namespace = 'common',
      fallback = key,
      interpolation = {},
    } = options;

    let translation: string | undefined;

    // Try current language first
    translation = this.getTranslation(key, this.currentLanguage, namespace);

    // Fallback to fallback language
    if (!translation && this.fallbackLanguage !== this.currentLanguage) {
      translation = this.getTranslation(key, this.fallbackLanguage, namespace);
    }

    // Use fallback if no translation found
    if (!translation) {
      translation = fallback;
    }

    // Apply interpolation
    return this.interpolate(translation, interpolation);
  }

  /**
   * Get translation for specific key and language
   */
  private getTranslation(key: string, language: string, namespace: string): string | undefined {
    // Try namespace first
    const namespaceKey = `${language}:${namespace}`;
    const namespaceTranslations = this.namespaces.get(namespaceKey);
    if (namespaceTranslations) {
      const translation = this.getNestedValue(namespaceTranslations, key);
      if (translation) return translation;
    }

    // Try common translations
    const commonTranslations = this.translations.get(language);
    if (commonTranslations) {
      const translation = this.getNestedValue(commonTranslations, key);
      if (translation) return translation;
    }

    return undefined;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Interpolate variables in translation string
   */
  private interpolate(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Update document direction based on current language
   */
  private updateDocumentDirection(): void {
    if (typeof document === 'undefined') return;

    const languageInfo = this.getCurrentLanguageInfo();
    if (languageInfo) {
      document.documentElement.dir = languageInfo.direction;
      document.documentElement.lang = this.currentLanguage;
    }
  }

  /**
   * Trigger language change event
   */
  private triggerLanguageChange(): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent('languageChange', {
      detail: {
        language: this.currentLanguage,
        languageInfo: this.getCurrentLanguageInfo(),
      },
    }));
  }

  /**
   * Format date according to current language
   */
  formatDate(date: Date | string | number, format?: string): string {
    const languageInfo = this.getCurrentLanguageInfo();
    if (!languageInfo) return new Date(date).toLocaleDateString();

    const dateObj = new Date(date);
    const locale = this.getLocaleForLanguage(languageInfo.code);

    if (format) {
      // Custom format implementation could go here
      return dateObj.toLocaleDateString(locale);
    }

    return dateObj.toLocaleDateString(locale);
  }

  /**
   * Format time according to current language
   */
  formatTime(date: Date | string | number, format?: string): string {
    const languageInfo = this.getCurrentLanguageInfo();
    if (!languageInfo) return new Date(date).toLocaleTimeString();

    const dateObj = new Date(date);
    const locale = this.getLocaleForLanguage(languageInfo.code);

    if (format) {
      // Custom format implementation could go here
      return dateObj.toLocaleTimeString(locale);
    }

    return dateObj.toLocaleTimeString(locale);
  }

  /**
   * Format number according to current language
   */
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const languageInfo = this.getCurrentLanguageInfo();
    if (!languageInfo) return number.toLocaleString();

    const locale = this.getLocaleForLanguage(languageInfo.code);
    return number.toLocaleString(locale, options);
  }

  /**
   * Format currency according to current language
   */
  formatCurrency(amount: number, currency?: string): string {
    const languageInfo = this.getCurrentLanguageInfo();
    if (!languageInfo) return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    const locale = this.getLocaleForLanguage(languageInfo.code);
    const currencyCode = currency || languageInfo.currency;

    return amount.toLocaleString(locale, {
      style: 'currency',
      currency: currencyCode,
    });
  }

  /**
   * Get locale for language code
   */
  private getLocaleForLanguage(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
    };

    return languageMap[languageCode] || languageCode;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(): Record<string, any> {
    return {
      currentLanguage: this.currentLanguage,
      fallbackLanguage: this.fallbackLanguage,
      availableLanguages: this.availableLanguages.length,
      loadedNamespaces: Array.from(this.namespaces.keys()),
      totalTranslations: this.translations.size,
    };
  }
}

// Export singleton instance
export const translocoService = new TranslocoService();
