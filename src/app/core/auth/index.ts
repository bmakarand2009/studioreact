/**
 * Authentication Service
 * Handles user authentication, token management, and session handling
 */

import { STORAGE_KEYS, API_CONFIG, HTTP_STATUS } from '../app-constants';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private user: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // Only initialize from storage on client side
    if (typeof window !== 'undefined') {
      this.initializeFromStorage();
    }
  }

  /**
   * Check if running on client side
   */
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Initialize auth state from cookies
   */
  private initializeFromStorage(): void {
    if (!this.isClient()) return;

    try {
      const storedToken = this.getCookie(STORAGE_KEYS.AUTH_TOKEN);
      const storedRefreshToken = this.getCookie(STORAGE_KEYS.REFRESH_TOKEN);
      const storedUser = this.getCookie(STORAGE_KEYS.USER_PREFERENCES);

      if (storedToken && storedRefreshToken) {
        this.accessToken = storedToken;
        this.refreshToken = storedRefreshToken;
        
        if (storedUser) {
          try {
            this.user = JSON.parse(storedUser);
          } catch (e) {
            console.error('Error parsing stored user data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data: { user: User; tokens: AuthTokens } = await response.json();
      
      this.setAuthData(data.user, data.tokens);
      return data.user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data: { user: User; tokens: AuthTokens } = await response.json();
      
      this.setAuthData(data.user, data.tokens);
      return data.user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        // Call logout endpoint to invalidate tokens
        await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.refreshToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      if (!this.refreshToken) {
        return null;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data: { accessToken: string; expiresIn: number } = await response.json();
      
      this.accessToken = data.accessToken;
      this.tokenExpiry = Date.now() + data.expiresIn * 1000;
      
      this.setCookie(STORAGE_KEYS.AUTH_TOKEN, this.accessToken, 7);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearAuth();
      return null;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (this.isTokenExpired()) {
      return null;
    }
    return this.accessToken;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    if (!this.user) return false;
    return this.user.permissions.includes(permission);
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    if (!this.user) return false;
    return this.user.role === role;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }

      const updatedUser: User = await response.json();
      
      this.user = { ...this.user, ...updatedUser };
      this.setCookie(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(this.user), 7);
      
      return this.user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Profile update failed');
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password change failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password change failed');
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  }

  /**
   * Set authentication data
   */
  private setAuthData(user: User, tokens: AuthTokens): void {
    this.user = user;
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiry = Date.now() + tokens.expiresIn * 1000;

    this.setCookie(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken, 7);
    this.setCookie(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken, 7);
    this.setCookie(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(user), 7);
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    if (this.isClient()) {
      this.deleteCookie(STORAGE_KEYS.AUTH_TOKEN);
      this.deleteCookie(STORAGE_KEYS.REFRESH_TOKEN);
      this.deleteCookie(STORAGE_KEYS.USER_PREFERENCES);
    }
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Cookie management methods
   */
  private setCookie(name: string, value: string, days: number = 7): void {
    if (!this.isClient()) return;

    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    if (!this.isClient()) return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private deleteCookie(name: string): void {
    if (!this.isClient()) return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}

// Export singleton instance
export const authService = new AuthService();
