/**
 * Icons Service
 * Manages application icons, icon sets, and icon utilities
 */

export interface IconDefinition {
  name: string;
  viewBox: string;
  path: string;
  size?: number;
  color?: string;
}

export interface IconSet {
  id: string;
  name: string;
  version: string;
  icons: IconDefinition[];
}

export interface IconOptions {
  size?: number;
  color?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

// Common icon definitions
const commonIcons: IconDefinition[] = [
  {
    name: 'dashboard',
    viewBox: '0 0 24 24',
    path: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  },
  {
    name: 'school',
    viewBox: '0 0 24 24',
    path: 'M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09v6L12 21l-5-2.18v-6L12 17l5-2.18v6L12 21l-5-2.18v-6L1 9l11-6z',
  },
  {
    name: 'people',
    viewBox: '0 0 24 24',
    path: 'M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L12 13l-2.99-4.01A2.5 2.5 0 0 0 7 8H5.46c-.8 0-1.54.37-2.01.99L1 18.5V22h2v-6h2.5l2.54-7.63A1.5 1.5 0 0 1 7 10h1.5c.8 0 1.54-.37 2.01-.99L12 5l1.5 4.01c.47.62 1.21.99 2.01.99H17c.8 0 1.54.37 2.01.99L21.5 16H24v6h-4z',
  },
  {
    name: 'settings',
    viewBox: '0 0 24 24',
    path: 'M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z',
  },
  {
    name: 'home',
    viewBox: '0 0 24 24',
    path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  },
  {
    name: 'search',
    viewBox: '0 0 24 24',
    path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  },
  {
    name: 'notifications',
    viewBox: '0 0 24 24',
    path: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  },
  {
    name: 'account',
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  },
  {
    name: 'logout',
    viewBox: '0 0 24 24',
    path: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  },
  {
    name: 'menu',
    viewBox: '0 0 24 24',
    path: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  },
  {
    name: 'close',
    viewBox: '0 0 24 24',
    path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  },
  {
    name: 'edit',
    viewBox: '0 0 24 24',
    path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  },
  {
    name: 'delete',
    viewBox: '0 0 24 24',
    path: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  },
  {
    name: 'add',
    viewBox: '0 0 24 24',
    path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  },
  {
    name: 'check',
    viewBox: '0 0 24 24',
    path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  },
  {
    name: 'warning',
    viewBox: '0 0 24 24',
    path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  },
  {
    name: 'error',
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  },
  {
    name: 'info',
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  },
  {
    name: 'help',
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
  },
  {
    name: 'visibility',
    viewBox: '0 0 24 24',
    path: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  },
  {
    name: 'visibility-off',
    viewBox: '0 0 24 24',
    path: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
  },
  {
    name: 'chevron-down',
    viewBox: '0 0 24 24',
    path: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
  },
  {
    name: 'chevron-up',
    viewBox: '0 0 24 24',
    path: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  },
  {
    name: 'chevron-left',
    viewBox: '0 0 24 24',
    path: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  },
  {
    name: 'chevron-right',
    viewBox: '0 0 24 24',
    path: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  },
];

class IconService {
  private iconSets: Map<string, IconSet> = new Map();
  private customIcons: Map<string, IconDefinition> = new Map();

  constructor() {
    this.initializeCommonIcons();
  }

  /**
   * Initialize common icons
   */
  private initializeCommonIcons(): void {
    const commonIconSet: IconSet = {
      id: 'common',
      name: 'Common Icons',
      version: '1.0.0',
      icons: commonIcons,
    };

    this.iconSets.set('common', commonIconSet);
    
    // Add individual icons to custom icons for easy access
    commonIcons.forEach(icon => {
      this.customIcons.set(icon.name, icon);
    });
  }

  /**
   * Get icon by name
   */
  getIcon(name: string): IconDefinition | null {
    // Check custom icons first
    if (this.customIcons.has(name)) {
      return this.customIcons.get(name)!;
    }

    // Check all icon sets
    for (const iconSet of this.iconSets.values()) {
      const icon = iconSet.icons.find(i => i.name === name);
      if (icon) {
        return icon;
      }
    }

    return null;
  }

  /**
   * Get all available icon names
   */
  getAvailableIconNames(): string[] {
    const names: string[] = [];
    
    for (const iconSet of this.iconSets.values()) {
      iconSet.icons.forEach(icon => {
        if (!names.includes(icon.name)) {
          names.push(icon.name);
        }
      });
    }

    for (const iconName of this.customIcons.keys()) {
      if (!names.includes(iconName)) {
        names.push(iconName);
      }
    }

    return names.sort();
  }

  /**
   * Get icon set by ID
   */
  getIconSet(id: string): IconSet | null {
    return this.iconSets.get(id) || null;
  }

  /**
   * Get all icon sets
   */
  getAllIconSets(): IconSet[] {
    return Array.from(this.iconSets.values());
  }

  /**
   * Add custom icon
   */
  addCustomIcon(icon: IconDefinition): void {
    this.customIcons.set(icon.name, icon);
  }

  /**
   * Remove custom icon
   */
  removeCustomIcon(name: string): boolean {
    return this.customIcons.delete(name);
  }

  /**
   * Add icon set
   */
  addIconSet(iconSet: IconSet): void {
    this.iconSets.set(iconSet.id, iconSet);
    
    // Add individual icons to custom icons for easy access
    iconSet.icons.forEach(icon => {
      this.customIcons.set(icon.name, icon);
    });
  }

  /**
   * Remove icon set
   */
  removeIconSet(id: string): boolean {
    const iconSet = this.iconSets.get(id);
    if (!iconSet) return false;

    // Remove individual icons from custom icons
    iconSet.icons.forEach(icon => {
      this.customIcons.delete(icon.name);
    });

    return this.iconSets.delete(id);
  }

  /**
   * Search icons by name
   */
  searchIcons(query: string): IconDefinition[] {
    const results: IconDefinition[] = [];
    const lowerQuery = query.toLowerCase();

    for (const icon of this.customIcons.values()) {
      if (icon.name.toLowerCase().includes(lowerQuery)) {
        results.push(icon);
      }
    }

    return results;
  }

  /**
   * Get icon as SVG string
   */
  getIconAsSvg(name: string, options: IconOptions = {}): string {
    const icon = this.getIcon(name);
    if (!icon) return '';

    const {
      size = 24,
      color = 'currentColor',
      className = '',
      onClick,
      disabled = false,
    } = options;

    const clickHandler = onClick && !disabled ? `onclick="${onClick.toString()}"` : '';
    const disabledAttr = disabled ? 'disabled="true"' : '';

    return `<svg 
      viewBox="${icon.viewBox}" 
      width="${size}" 
      height="${size}" 
      fill="${color}" 
      class="${className}" 
      ${clickHandler} 
      ${disabledAttr}
      style="pointer-events: ${onClick ? 'auto' : 'none'}"
    >
      <path d="${icon.path}"/>
    </svg>`;
  }

  /**
   * Get icon as React component props
   */
  getIconAsProps(name: string, options: IconOptions = {}): any {
    const icon = this.getIcon(name);
    if (!icon) return {};

    const {
      size = 24,
      color = 'currentColor',
      className = '',
      onClick,
      disabled = false,
    } = options;

    return {
      viewBox: icon.viewBox,
      width: size,
      height: size,
      fill: color,
      className,
      onClick: disabled ? undefined : onClick,
      disabled,
      style: { pointerEvents: onClick ? 'auto' : 'none' },
      children: { type: 'path', props: { d: icon.path } },
    };
  }

  /**
   * Validate icon definition
   */
  validateIcon(icon: IconDefinition): boolean {
    return !!(
      icon.name &&
      icon.viewBox &&
      icon.path &&
      icon.name.trim() !== '' &&
      icon.viewBox.trim() !== '' &&
      icon.path.trim() !== ''
    );
  }

  /**
   * Export icon set as JSON
   */
  exportIconSet(id: string): string | null {
    const iconSet = this.getIconSet(id);
    if (!iconSet) return null;

    return JSON.stringify(iconSet, null, 2);
  }

  /**
   * Import icon set from JSON
   */
  importIconSet(json: string): boolean {
    try {
      const iconSet: IconSet = JSON.parse(json);
      
      if (!iconSet.id || !iconSet.name || !Array.isArray(iconSet.icons)) {
        return false;
      }

      // Validate all icons
      for (const icon of iconSet.icons) {
        if (!this.validateIcon(icon)) {
          return false;
        }
      }

      this.addIconSet(iconSet);
      return true;
    } catch (error) {
      console.error('Error importing icon set:', error);
      return false;
    }
  }
}

// Export singleton instance
export const iconService = new IconService();
