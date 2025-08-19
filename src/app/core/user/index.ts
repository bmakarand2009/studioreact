/**
 * User Service
 * Simple data service for user operations - no state management
 * React state management should be handled by hooks and context
 */

import { API_CONFIG } from '../app-constants';
import { authService } from '../auth';

export interface UserProfile {
  guId: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  fullName: string;
  displayName?: string;
  avatar?: string;
  picture?: string;
  bio?: string;
  phone?: string;
  role: string;
  orgId: string;
  tenantId?: string;
  isLoggedIn: boolean;
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified: boolean;
  isAdminVerified: boolean;
  isFirstLogin: boolean;
  isNewClient?: boolean;
  isNewTenant?: boolean;
  hasAcceptedTerms: boolean;
  hasParent?: boolean;
  isParent?: boolean;
  balance?: number;
  children?: any[];
  description?: string;
  imageUrl?: string;
  isLocalPicture?: string;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: string[];
  // Student-specific fields
  isStudentPreview?: boolean;
  studentToken?: string;
  // Admin-specific fields
  isPreviewMode?: boolean;
  isPreviewOfSecuredPage?: boolean;
  // Additional fields that might come from backend
  [key: string]: any;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    updates: boolean;
    security: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowSearch: boolean;
    allowContact: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'profile_update' | 'password_change' | 'course_access' | 'file_download' | 'other';
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface UserSearchParams {
  query?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  tenantId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchResult {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UserService {
  private userCache: Map<string, UserProfile> = new Map();
  private settingsCache: Map<string, UserSettings> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if user has specific role
   */
  hasRole(user: UserProfile | null, role: string | string[]): boolean {
    if (!user?.role) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }

  /**
   * Check if user is staff (admin, staff, or frontdesk)
   */
  isStaffRole(user: UserProfile | null): boolean {
    return this.hasRole(user, ['ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_FRONTDESK']);
  }

  /**
   * Check if user is student
   */
  isStudentRole(user: UserProfile | null): boolean {
    return this.hasRole(user, 'ROLE_STUDENT');
  }

  /**
   * Check if user is admin
   */
  isAdminRole(user: UserProfile | null): boolean {
    return this.hasRole(user, 'ROLE_ADMIN');
  }

  /**
   * Check if user is in student preview mode
   */
  isStudentPreview(user: UserProfile | null): boolean {
    return user?.isStudentPreview || false;
  }

  /**
   * Check if user is in preview mode
   */
  isPreviewMode(user: UserProfile | null): boolean {
    return user?.isPreview || false;
  }

  /**
   * Get the original role when in preview mode
   */
  getOriginalRole(user: UserProfile | null): string | null {
    if (user?.isPreview && user.originalRole) {
      return user.originalRole;
    }
    return user?.role || null;
  }

  /**
   * Check if user can preview other users
   */
  canPreviewUsers(user: UserProfile | null): boolean {
    return this.hasRole(user, ['ROLE_ADMIN', 'ROLE_STAFF']);
  }

  /**
   * Get user role
   */
  getUserRole(user: UserProfile | null): string | null {
    return user?.role || null;
  }

  /**
   * Get organization ID
   */
  getOrgId(user: UserProfile | null): string | null {
    return user?.orgId || null;
  }

  /**
   * Get tenant ID
   */
  getTenantId(user: UserProfile | null): string | null {
    return user?.tenantId || null;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(user: UserProfile | null): string[] {
    return user?.permissions || [];
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }

      const updatedProfile: UserProfile = await response.json();
      
      // Update cache
      this.cacheUserProfile(updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Check cache first
    if (this.isCacheValid(userId)) {
      return this.userCache.get(userId) || null;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        headers: {
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch user profile');
      }

      const userProfile: UserProfile = await response.json();
      
      // Cache the result
      this.cacheUserProfile(userProfile);
      
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    // Check cache first
    const cacheKey = `settings_${userId}`;
    if (this.isCacheValid(cacheKey)) {
      return this.settingsCache.get(userId) || null;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/settings`, {
        headers: {
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch user settings');
      }

      const userSettings: UserSettings = await response.json();
      
      // Cache the result
      this.cacheUserSettings(userSettings);
      
      return userSettings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update user settings');
      }

      const updatedSettings: UserSettings = await response.json();
      
      // Cache the result
      this.cacheUserSettings(updatedSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      return null;
    }
  }

  /**
   * Search users
   */
  async searchUsers(params: UserSearchParams): Promise<UserSearchResult | null> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.query) queryParams.append('q', params.query);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);
      if (params.tenantId) queryParams.append('tenantId', params.tenantId);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/search?${queryParams}`, {
        headers: {
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching users:', error);
      return null;
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limit = 50): Promise<UserActivity[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/activity?limit=${limit}`, {
        headers: {
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user activity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/avatar`, {
        method: 'POST',
        headers: {
          ...authService.getAuthHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const result = await response.json();
      return result.avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }

  /**
   * Delete user account
   */
  async deleteUserAccount(userId: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user account');
      }

      // Clear cache
      this.clearUserCache(userId);

      return true;
    } catch (error) {
      console.error('Error deleting user account:', error);
      return false;
    }
  }

  /**
   * Change user password
   */
  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  /**
   * Verify user email
   */
  async verifyUserEmail(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify email');
      }

      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      return false;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend verification email');
      }

      return true;
    } catch (error) {
      console.error('Error resending verification email:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<Record<string, any> | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/statistics`, {
        headers: {
          ...authService.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      return null;
    }
  }

  /**
   * Cache user profile
   */
  private cacheUserProfile(profile: UserProfile): void {
    this.userCache.set(profile.guId, profile);
    this.cacheExpiry.set(profile.guId, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Cache user settings
   */
  private cacheUserSettings(settings: UserSettings): void {
    this.settingsCache.set(settings.userId, settings);
    this.cacheExpiry.set(`settings_${settings.userId}`, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Clear user cache
   */
  private clearUserCache(userId?: string): void {
    if (userId) {
      this.userCache.delete(userId);
      this.settingsCache.delete(userId);
      this.cacheExpiry.delete(userId);
      this.cacheExpiry.delete(`settings_${userId}`);
    } else {
      this.userCache.clear();
      this.settingsCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.userCache.clear();
    this.settingsCache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const userService = new UserService();
