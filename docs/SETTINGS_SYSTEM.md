# Settings System Documentation

## Overview

The Wajooba LMS settings system provides a comprehensive way to manage application configuration, user roles, payment gateways, integrations, and more. The system is built with React and TypeScript, featuring a modern UI with proper backend connectivity.

## Architecture

### Core Components

1. **Settings Service** (`src/services/settingsService.ts`)
   - Centralized API service for all settings operations
   - Handles authentication, error handling, and data transformation
   - Supports both real API calls and fallback mock data

2. **Settings Pages**
   - Main settings hub (`/admin/settings`)
   - Individual settings pages for each category
   - Role-based access control with `withRole` guard

3. **UI Components**
   - Reusable form components (Input, Select, Switch, etc.)
   - Consistent design system with Tailwind CSS
   - Responsive layouts for all screen sizes

## Available Settings Pages

### 1. Account Settings (`/admin/settings/account`)
- Organization details and contact information
- Address and preferences configuration
- Account owner management

### 2. Website Settings (`/admin/settings/website`)
- Basic website information (title, description, keywords)
- Domain and branding configuration
- SEO and analytics settings

### 3. Module Settings (`/admin/settings/display`)
- Enable/disable system modules
- Feature toggles for different user types
- Immediate application of changes

### 4. Payment Settings (`/admin/settings/payment`)
- Payment gateway configuration
- Stripe, PayPal, Razorpay support
- Test mode and live mode switching
- Connection testing capabilities

### 5. Integrations (`/admin/settings/integrations`)
- Third-party service connections
- Email services (Mailchimp, Brevo)
- SMS services (Twilio, Plivo)
- Analytics and webhook configurations

### 6. Users (`/admin/settings/users`)
- User management and permissions
- Role assignment and status management
- Search and filtering capabilities

### 7. Roles (`/admin/settings/roles`)
- Role-based access control
- Permission management
- User count tracking
- Security guidelines

## Backend Connectivity

### API Endpoints

The settings system connects to the following API endpoints:

```typescript
// Account & Organization
GET    /snode/tenant                    // Get account details
PUT    /snode/tenant                    // Update account details

// Website & SEO
GET    /rest/website/settings           // Get website settings
PUT    /rest/website/settings           // Update website settings

// Modules & Features
GET    /rest/modules/settings           // Get module settings
PATCH  /rest/modules/settings/:id       // Update module status

// Users & Roles
GET    /rest/users                      // Get users list
POST   /rest/users                      // Create user
PUT    /rest/users/:id                  // Update user
DELETE /rest/users/:id                  // Delete user

GET    /rest/roles                      // Get roles list
POST   /rest/roles                      // Create role
PUT    /rest/roles/:id                  // Update role
DELETE /rest/roles/:id                  // Delete role

// Payment & Integrations
GET    /rest/payment/providers          // Get payment providers
PUT    /rest/payment/providers/:id      // Update payment settings
POST   /rest/payment/providers/:id/test // Test payment connection

GET    /rest/integrations               // Get integrations
PUT    /rest/integrations/:id           // Update integration
POST   /rest/integrations/:id/test      // Test integration

// Custom Fields
GET    /rest/customField                // Get custom fields
POST   /rest/customField                // Create custom field
PUT    /rest/customField/:id            // Update custom field
DELETE /rest/customField/:id            // Delete custom field

// Utility
GET    /ping                            // Health check
GET    /plugin/app/version              // Get app version
```

### Authentication

All API calls require a valid JWT token:
- Token is automatically included in request headers
- Uses `Authorization: Bearer <token>` format
- Token is retrieved from `authService.accessToken`

### Error Handling

The system includes comprehensive error handling:
- Network errors are caught and displayed
- API errors show meaningful messages
- Fallback to mock data when APIs are unavailable
- Retry mechanisms for failed requests

## Environment Configuration

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.wajooba.me

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false

# External Services
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### Environment Detection

The system automatically detects the current environment:
- **Development**: Local development with debug features
- **Production**: Live environment with optimizations
- **Staging**: Testing environment with production-like settings

## API Connectivity Testing

### Built-in Test Component

The main settings page includes an API connectivity test component that:
- Tests all major API endpoints
- Measures response times
- Shows success/failure status
- Provides detailed error messages
- Helps diagnose connectivity issues

### Running Tests

1. Navigate to `/admin/settings`
2. Scroll to the "API Connectivity Test" section
3. Click "Run Tests" to start testing
4. Review results and response times
5. Use "Run Tests Again" to re-test

## Development

### Adding New Settings

1. **Create the Service Method**
   ```typescript
   // In settingsService.ts
   async getNewSettings(): Promise<NewSettings> {
     return this.makeRequest<NewSettings>('/rest/new-settings');
   }
   ```

2. **Create the Settings Page**
   ```typescript
   // Create src/app/admin/settings/new-settings/page.tsx
   // Use withRole guard for protection
   // Implement form handling and API calls
   ```

3. **Add to Main Settings**
   ```typescript
   // In src/app/admin/settings/page.tsx
   // Add to settingsList array
   ```

### Mock Data

When APIs are unavailable, the system falls back to mock data:
- Mock data is defined in each settings page
- Provides realistic examples for development
- Can be enabled/disabled via environment variables

### Testing

- Use the built-in API connectivity test
- Test with different authentication states
- Verify error handling with invalid tokens
- Test responsive design on different screen sizes

## Security Considerations

### Role-Based Access Control

- All settings pages are protected by `withRole` guard
- Only users with `ROLE_ADMIN` can access settings
- Individual permissions can be configured per role

### Data Validation

- Form validation using Zod schemas
- Input sanitization and validation
- API response validation
- Error boundary protection

### Authentication

- JWT token validation
- Automatic token refresh
- Secure token storage
- Session management

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `NEXT_PUBLIC_API_URL` environment variable
   - Verify backend service is running
   - Check authentication token validity

2. **Settings Not Saving**
   - Verify user has admin role
   - Check API endpoint permissions
   - Review browser console for errors

3. **UI Not Loading**
   - Check component imports
   - Verify TypeScript compilation
   - Check for missing dependencies

### Debug Mode

Enable debug mode for development:
```bash
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

This will show:
- API request/response details
- Component render information
- Performance metrics
- Error stack traces

## Performance

### Optimizations

- Lazy loading of settings pages
- Memoized components and hooks
- Efficient state management
- Optimized API calls with caching

### Monitoring

- Response time tracking
- Error rate monitoring
- User interaction analytics
- Performance metrics collection

## Future Enhancements

### Planned Features

- Bulk operations for settings
- Settings templates and presets
- Advanced search and filtering
- Settings import/export
- Audit logging for changes
- Real-time settings updates

### Integration Possibilities

- Webhook notifications
- External configuration management
- Multi-environment support
- Advanced role management
- Custom field builders

## Support

For questions or issues with the settings system:
1. Check this documentation
2. Review the API connectivity test results
3. Check browser console for errors
4. Verify environment configuration
5. Test with different user roles

---

*Last updated: January 2024*
*Version: 1.0.0*
