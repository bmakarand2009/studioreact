# User Service Architecture - wisely-react

## Overview

This document explains the comprehensive user service architecture implemented in wisely-react, which follows the best practices from both v5byclasses (Angular) and wisely-ui (React) applications.

## 🏗️ Architecture Principles

### 1. **Reactive State Management**
- **Pattern**: Following v5byclasses `BehaviorSubject` approach
- **Implementation**: Event listener system with real-time state synchronization
- **Benefits**: Components automatically update when user state changes

### 2. **Unified User Storage**
- **Memory Storage**: User data stored in service instance for performance
- **Cookie Storage**: Essential auth data (tokens, roles, org IDs) stored in cookies
- **Cache Layer**: Intelligent caching with expiry for API responses
- **Consistency**: Single source of truth across all services

### 3. **Multi-Service Integration**
- **UserService**: Primary user data management
- **AuthService**: Authentication and token management
- **AppLoadService**: Tenant and organization initialization
- **Synchronization**: All services stay in sync automatically

## 🔧 Core Components

### UserService (`src/app/core/user/index.ts`)

#### **State Management**
```typescript
class UserService {
  // Reactive state (following v5byclasses pattern)
  private _currentUser: UserProfile | null = null;
  private _isAuthenticated: boolean = false;
  private _userRole: string | null = null;
  private _orgId: string | null = null;
  private _tenantId: string | null = null;
  
  // Event listeners for real-time updates
  private userStateListeners: Set<(user: UserProfile | null) => void> = new Set();
  private authStateListeners: Set<(isAuthenticated: boolean) => void> = new Set();
}
```

#### **Key Methods**
- `setCurrentUser(user)`: Sets user and notifies all listeners
- `clearCurrentUser()`: Clears user and notifies all listeners
- `addUserStateListener(listener)`: Subscribe to user state changes
- `addAuthStateListener(listener)`: Subscribe to auth state changes

### useAuth Hook (`src/hooks/useAuth.ts`)

#### **Reactive Integration**
```typescript
export function useAuth(): UseAuthReturn {
  // Set up listeners for real-time updates
  useEffect(() => {
    const unsubscribeUser = userService.addUserStateListener((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
    });

    const unsubscribeAuth = userService.addAuthStateListener((isAuth) => {
      setIsAuthenticated(isAuth);
      if (!isAuth) {
        setUser(null);
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeAuth();
    };
  }, []);
}
```

## 📊 Data Flow

### 1. **Login Flow**
```
User Login → AuthService.login() → 
UserService.setCurrentUser() → 
Notify Listeners → 
Components Update
```

### 2. **State Persistence**
```
Page Refresh → 
UserService.initializeFromStorage() → 
Check Cookies → 
Restore User State → 
Notify Listeners
```

### 3. **Real-time Updates**
```
User State Change → 
UserService.notifyUserStateChange() → 
All Listeners Notified → 
Components Re-render
```

## 🗄️ Storage Strategy

### **Cookies (Essential Data)**
- `accessToken`: JWT access token
- `refreshToken`: JWT refresh token  
- `userRole`: User's role (ROLE_ADMIN, ROLE_STUDENT, etc.)
- `orgId`: Organization identifier
- `tenantId`: Tenant identifier

### **Memory (Performance)**
- `_currentUser`: Current user profile object
- `_isAuthenticated`: Authentication state
- `_userRole`: User role (cached)
- `_orgId`: Organization ID (cached)
- `_tenantId`: Tenant ID (cached)

### **Cache (API Responses)**
- User profiles: 5-minute expiry
- User settings: 5-minute expiry
- Intelligent cache invalidation

## 🔐 Authentication Patterns

### **Token Management**
```typescript
// Following v5byclasses pattern
private storeTokenDetails(access_token: string, refresh_token: string): void {
  const decodeAuth: any = jwt_decode(access_token);
  this.tokenExpiryTime = decodeAuth.exp;
  this.setAuthToken(access_token);
  this.setAuthRefreshToken(refresh_token);
}
```

### **Role-Based Access Control**
```typescript
// Staff roles (following v5byclasses pattern)
isStaffRole(): boolean {
  return this.hasRole(['ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_FRONTDESK']);
}

// Student role
isStudentRole(): boolean {
  return this.hasRole('ROLE_STUDENT');
}

// Admin role
isAdminRole(): boolean {
  return this.hasRole('ROLE_ADMIN');
}
```

### **Preview Mode Support**
```typescript
// Student preview mode (following v5byclasses pattern)
setStudentPreviewMode(isPreview: boolean): void {
  if (this._currentUser) {
    this._currentUser.isStudentPreview = isPreview;
    this.notifyUserStateChange(this._currentUser);
  }
}
```

## 🚀 Performance Features

### **Intelligent Caching**
- **Memory First**: Check memory before API calls
- **Cache Validation**: 5-minute cache expiry
- **Selective Updates**: Only update changed data
- **Batch Operations**: Efficient cache clearing

### **Lazy Loading**
- **Profile Loading**: Load user profile on demand
- **Settings Loading**: Load user settings when needed
- **Permission Checking**: Check permissions as required

### **State Synchronization**
- **Real-time Updates**: Immediate state propagation
- **Efficient Rendering**: Only affected components re-render
- **Memory Management**: Automatic cleanup of listeners

## 🔄 Integration Points

### **With AuthService**
```typescript
// AuthService integrates with UserService
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  // ... login logic ...
  
  // Set in both services for consistency
  this.setCurrentUser(data.contact);
  
  // Convert to UserProfile and set in user service
  const userProfile = await userService.getCurrentUserProfile();
  if (userProfile) {
    userService.setCurrentUser(userProfile);
  }
}
```

### **With AppLoadService**
```typescript
// UserService uses AppLoadService for tenant data
private convertToUserProfile(data: any): UserProfile {
  return {
    // ... other fields ...
    orgId: data.orgId || appLoadService.tenantDetails?.orgId || '',
    tenantId: data.tenantId || appLoadService.tenantId || '',
  };
}
```

### **With Components**
```typescript
// Components subscribe to user state changes
const { user, isAuthenticated } = useAuth();

// Components can also directly access user service
import { userService } from '@/app/core/user';
const currentUser = userService.getCurrentUser();
```

## 🛡️ Security Features

### **Token Security**
- **Cookie Storage**: Secure cookie settings with SameSite=Lax
- **Automatic Expiry**: Token expiry checking and refresh
- **Secure Headers**: Proper Authorization headers for API calls

### **Data Validation**
- **Input Sanitization**: All user inputs validated
- **Role Verification**: Server-side role validation
- **Permission Checking**: Granular permission system

### **Session Management**
- **Automatic Logout**: Token expiry handling
- **State Cleanup**: Proper cleanup on logout
- **Multi-tab Support**: Consistent state across browser tabs

## 📱 Usage Examples

### **Basic Usage in Components**
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return (
    <div>
      <h1>Welcome, {user?.fullName}</h1>
      {hasRole('ROLE_ADMIN') && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### **Direct Service Usage**
```typescript
import { userService } from '@/app/core/user';

// Check user role
if (userService.isStaffRole()) {
  // Show staff features
}

// Get current user
const currentUser = userService.getCurrentUser();

// Subscribe to changes
const unsubscribe = userService.addUserStateListener((user) => {
  console.log('User changed:', user);
});
```

### **Advanced State Management**
```typescript
// Set preview mode
userService.setStudentPreviewMode(true);

// Update user profile
await userService.updateUserProfile(userId, {
  firstName: 'New Name',
  email: 'new@email.com'
});

// Check permissions
const hasPermission = await userService.hasPermission('manage_users');
```

## 🔧 Configuration

### **Environment Variables**
```typescript
// Cache duration
private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cookie settings
private setCookie(name: string, value: string, days: number = 7): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}
```

### **API Configuration**
```typescript
// Base API URL from environment
import { API_CONFIG } from '../app-constants';

// API endpoints
const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
  headers: {
    ...authService.getAuthHeaders(),
  },
});
```

## 🚨 Error Handling

### **Graceful Degradation**
- **API Failures**: Fallback to cached data
- **Token Expiry**: Automatic logout and redirect
- **Network Issues**: Retry mechanisms and error states

### **User Feedback**
- **Loading States**: Clear loading indicators
- **Error Messages**: User-friendly error messages
- **Retry Options**: Retry failed operations

## 🔮 Future Enhancements

### **Planned Features**
- **Offline Support**: Service worker integration
- **Real-time Sync**: WebSocket integration for live updates
- **Advanced Caching**: Redis-like cache strategies
- **Analytics**: User behavior tracking

### **Scalability Considerations**
- **Memory Optimization**: Efficient data structures
- **Performance Monitoring**: Metrics and profiling
- **Load Balancing**: Multiple service instances
- **Database Optimization**: Query optimization and indexing

## 📚 References

### **v5byclasses Patterns**
- `TenantUserService`: User state management
- `BehaviorSubject`: Reactive state updates
- Token management and role checking
- Multi-tenant support

### **wisely-ui Patterns**
- User profile management
- Permission system
- Caching strategies
- API integration

### **React Best Practices**
- Hooks for state management
- Effect cleanup and memory management
- Component lifecycle integration
- Performance optimization

---

This architecture provides a robust, scalable, and maintainable foundation for user management in wisely-react, combining the best practices from both Angular and React ecosystems.
