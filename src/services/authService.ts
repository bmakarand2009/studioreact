import { AuthUtils } from '@/utils/authUtils';
import { environment } from '@/config/environment';
import { logEnvironmentInfo } from '@/utils/environment';
import { appLoadService } from '@/app/core/app-load';

export interface LoginCredentials {
  userId: string;
  password: string;
  rememberMe?: boolean;
  tid?: string;
}

export interface AuthResponse {
  contact: any;
  access_token: string;
  email?: string;
  isNewProfile?: boolean;
  orgList?: any;
  refresh_token?: string;
  role?: string;
  tenant?: any;
}

export interface ForgotPasswordData {
  email: string;
  orgId?: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface OAuthConfig {
  domain: string;
  clientId: string;
  redirectUri: string;
}

export class AuthService {
  private _authenticated = false;
  private _currentUser: any = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.apiBaseUrl;
    logEnvironmentInfo();
  }

  private setCookie(name: string, value: string, days: number = 7): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
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
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  get accessToken(): string {
    return this.getCookie('accessToken') ?? '';
  }

  set accessToken(token: string) {
    this.setCookie('accessToken', token, 7);
  }

  get refreshToken(): string {
    return this.getCookie('refreshToken') ?? '';
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  /**
   * Check if the current token is an OAuth token
   * OAuth tokens might need different handling than system tokens
   */
  private isOAuthToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      
      return payload.iss && (
        payload.iss.includes('google') || 
        payload.iss.includes('auth0') || 
        payload.iss.includes('oauth')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user - returns from memory if available, otherwise fetches from backend
   */
  async getCurrentUser(): Promise<any> {
    if (this._currentUser) {
      return this._currentUser;
    }

    try {
      const token = this.accessToken;
      if (!token) {
        return null;
      }

      const isOAuth = this.isOAuthToken(token);

      const response = await fetch(`${this.baseUrl}/rest/reInitInfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const user = data.contact || null;
      
      if (user) {
        this._currentUser = user;
      }
      
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set current user (used after login)
   */
  setCurrentUser(user: any): void {
    this._currentUser = user;
  }

  /**
   * Clear current user (used on logout)
   */
  clearCurrentUser(): void {
    this._currentUser = null;
  }

  /**
   * Initialize authentication state from localStorage
   */
  initializeAuthState(): void {
    const token = this.accessToken;
    
    if (token) {
      this._authenticated = true;
    } else {
      this._authenticated = false;
    }
  }

  /**
   * Sign in the user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (this._authenticated) {
      throw new Error('User is already authenticated');
    }

    try {
      const tenantId = appLoadService.tenantId || credentials.tid || environment.defaultTenantId;
      
      if (!tenantId) {
        throw new Error('Tenant ID not available. Please ensure app is properly initialized.');
      }

      const response = await fetch(`${this.baseUrl}/public/user/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          tid: tenantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      if (data.contact && data.access_token) {
        this._authenticated = true;
        this.accessToken = data.access_token;
        
        this.setCurrentUser(data.contact);
        
        if (data.refresh_token) {
          this.setCookie('refreshToken', data.refresh_token, 30);
        }
        
        return data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * OAuth login methods - Using v5byclasses approach (backend provides redirect URL)
   */
  async googleLogin(): Promise<void> {
    if (!environment.enableOAuth) {
      throw new Error('OAuth is not enabled');
    }
    
    try {
      const tenantId = appLoadService.tenantId;
      const orgId = appLoadService.tenantDetails?.orgId;
      
      if (!tenantId || !orgId) {
        throw new Error('Tenant details not available for OAuth');
      }

      const response = await fetch(`${this.baseUrl}/authmgr/pauth/glogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: orgId,
          tid: tenantId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get OAuth redirect URL: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && typeof data === 'string') {
        window.open(data, '_self');
      } else {
        throw new Error('Invalid redirect URL response from backend');
      }
    } catch (error) {
      throw new Error('Failed to initiate Google OAuth login');
    }
  }

  async facebookLogin(): Promise<void> {
    if (!environment.enableOAuth) {
      throw new Error('OAuth is not enabled');
    }
    
    try {
      const tenantId = appLoadService.tenantId;
      const orgId = appLoadService.tenantDetails?.orgId;
      
      if (!tenantId || !orgId) {
        throw new Error('Tenant details not available for OAuth');
      }

      const response = await fetch(`${this.baseUrl}/authmgr/pauth/flogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: orgId,
          tid: tenantId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get OAuth redirect URL: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && typeof data === 'string') {
        window.open(data, '_self');
      } else {
        throw new Error('Invalid redirect URL response from backend');
      }
    } catch (error) {
      throw new Error('Failed to initiate Facebook OAuth login');
    }
  }

  /**
   * Manual method to check for OAuth callbacks (for testing)
   * Can be called from browser console: authService.manualCheckOAuth()
   */
  async manualCheckOAuth(): Promise<boolean> {
    const result = await this.checkOAuthCallback();
    return result;
  }

  /**
   * Check for OAuth callback and handle authentication
   * Simplified approach: just store the OAuth token, let check() method handle validation
   */
  async checkOAuthCallback(): Promise<boolean> {
    try {
      const accessToken = this.extractOAuthToken();
      
      if (accessToken) {
        this.accessToken = accessToken;
        this._authenticated = true;
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      const orgId = appLoadService.tenantDetails?.orgId || data.orgId || window.location.hostname;
      
      if (!orgId) {
        throw new Error('Organization ID not available. Please ensure app is properly initialized.');
      }

      const response = await fetch(`${this.baseUrl}/rest/user/forgotPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          orgId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Forgot password failed: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
    } catch (error) {
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/public/user/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
    } catch (error) {
      // Silent fail on logout API error
    } finally {
      this.deleteCookie('accessToken');
      this.deleteCookie('refreshToken');
      
      this._authenticated = false;
      this.clearCurrentUser();
    }
  }

  /**
   * Sign in using token (reInitInfo)
   */
  async signInUsingToken(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/reInitInfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token validation failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check authentication status
   * This is the central method for token validation
   */
  async check(): Promise<boolean> {
    try {
      const token = this.accessToken;
      if (!token) {
        return false;
      }

      if (this._currentUser) {
        this._authenticated = true;
        return true;
      }

      try {
        const user = await this.getCurrentUser();
        if (user) {
          this._authenticated = true;
          return true;
        }
      } catch (apiError) {
        this.accessToken = '';
        this._authenticated = false;
        this.clearCurrentUser();
      }
      
      this._authenticated = false;
      return false;
    } catch (error) {
      this._authenticated = false;
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<string[]> {
    const user = await this.getCurrentUser();
    return user?.permissions || [];
  }

  /**
   * Check if user has permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.includes(permission);
  }

  /**
   * Get user role
   */
  async getUserRole(): Promise<string> {
    const user = await this.getCurrentUser();
    return user?.role || '';
  }

  /**
   * Check if user has role
   */
  async hasRole(role: string): Promise<boolean> {
    const userRole = await this.getUserRole();
    return userRole === role;
  }

  /**
   * Get query parameter from URL (matching v5byclasses pattern)
   */
  private getQueryParameter(key: string): string | null {
    try {
      const parameters = new URLSearchParams(window.location.search);
      return parameters.get(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get hash parameter from URL (matching v5byclasses pattern exactly)
   */
  private getHashParameter(key: string): string | null {
    try {
      const hash = window.location.hash.substring(1);
      if (!hash) return null;
      
      const params = new URLSearchParams(hash);
      return params.get(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * Comprehensive OAuth token extraction from URL
   * Handles different Google OAuth response formats
   */
  private extractOAuthToken(): string | null {
    try {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        
        const token = hashParams.get('access_token') || 
                     hashParams.get('auth') || 
                     hashParams.get('token') ||
                     hashParams.get('id_token');
        
        if (token) {
          return token;
        }
      }

      const search = window.location.search.substring(1);
      if (search) {
        const searchParams = new URLSearchParams(search);
        
        const token = searchParams.get('access_token') || 
                     searchParams.get('auth') || 
                     searchParams.get('token') ||
                     searchParams.get('id_token');
        
        if (token) {
          return token;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
