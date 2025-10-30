# Wajooba LMS - React Frontend

## Project Overview
This is the Wajooba Learning Management System (LMS) frontend application. It's a pure React + Vite application that connects to an external API backend.

**Current State:** Fully configured and running on Replit  
**Last Updated:** October 30, 2025

## Architecture

### Technology Stack
- **Framework:** React 19.1.0
- **Build Tool:** Vite 5.4.21
- **Routing:** React Router DOM v7
- **State Management:** Zustand
- **UI Components:** Material-UI (MUI), Tailwind CSS
- **Forms:** React Hook Form with Zod validation
- **HTTP Client:** Axios with React Query

### Project Structure
- **Frontend Only:** This is a pure frontend application with no backend dependencies
- **API Integration:** Connects to external API at `api.wajooba.me` (development)
- **Next.js Shims:** Contains shims for Next.js compatibility (originally migrated from Next.js)

## Configuration

### Environment
- **Development API:** https://api.wajooba.me
- **Staging API:** https://api.wajooba.xyz
- **Production API:** https://api.onwajooba.com

### Replit Setup
- **Port:** 5000 (configured for Replit webview)
- **Host:** 0.0.0.0 (allows proxy access)
- **Workflow:** `npm run dev` starts the development server
- **Deployment:** Configured for autoscale deployment with build step

## Key Features
- Multi-role system (Admin, Staff, Student)
- Course management
- User authentication and authorization
- Dashboard views for different user types
- Public pages (About, Contact, Courses)
- Assessment and calendar features for students

## Development

### Running the App
The app runs automatically via the configured workflow. The development server starts on port 5000.

### Building for Production
```bash
npm run build        # Standard production build
npm run build:dev    # Development mode build
```

### Important Notes
- All data comes from external APIs (no local backend)
- Authentication uses token-based system with localStorage
- The app uses environment variables prefixed with `VITE_`
- Vite config includes path aliases (@/ maps to src/)

## Authentication Flow

### App Initialization
1. **Tenant Ping**: On app load, `AppInitializer` calls `appLoadService.initAppConfig()`
   - Pings: `https://api.wajooba.me/snode/tenant/ping?name=marksampletest`
   - Retrieves tenant details including `tenantId` (required for login)
   - Shows screen only after successful tenant initialization

### User Login Process
2. **Login Submission**: User enters credentials and submits form
   - Calls: `authService.login({ userId, password })`
   - Posts to: `${baseUrl}/public/user/signin`
   - Includes `tenantId` from app initialization

3. **Token Storage**: API returns authentication response
   - Response includes: `access_token`, `refresh_token`, and `contact` (user data)
   - Tokens are stored in **browser cookies** with 7-day expiry (access) and 30-day expiry (refresh)
   - Cookie name: `accessToken` (not localStorage)

4. **Subsequent API Calls**: All authenticated requests include the token
   - `api.ts` reads token from cookies via `getCookie('accessToken')`
   - Adds to header: `Authorization: Bearer ${token}`
   - Automatic token refresh on 401 responses using `refreshToken`

### Token Management
- **Storage Location**: HTTP cookies (SameSite=Lax)
- **Retrieval**: `authService.accessToken` getter reads from cookies
- **Auto-Refresh**: On 401 error, attempts refresh with `refreshToken`
- **Logout**: Deletes both `accessToken` and `refreshToken` cookies

## Role-Based Routing System

### Unified Admin Access
The application implements a unified admin interface where both ROLE_ADMIN and ROLE_STAFF users access the same admin dashboard and features.

**Role Routing Rules:**
- **ROLE_ADMIN** → `/admin/dashboard` (full admin access)
- **ROLE_STAFF** → `/admin/dashboard` (unified admin access)
- **ROLE_STUDENT** → `/student/dashboard` (student portal)

### Role Normalization
The system handles role variations automatically through `UserService.hasRole()`:
- Accepts uppercase: `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_STUDENT`
- Accepts lowercase: `admin`, `staff`, `student`
- Handles with/without `ROLE_` prefix
- Preview mode users can simulate any role for testing

### Implementation Details
- **Login redirect** (`login/page.tsx`): Routes based on normalized role
- **Dashboard redirect** (`dashboard/page.tsx`): Central routing logic
- **Route guards** (`withRole.tsx`): Protects routes with role verification
- **Navigation** (`wajooba-public-layout.tsx`): Dashboard buttons route correctly
- **Admin pages**: All admin routes accept both ROLE_ADMIN and ROLE_STAFF

## Recent Changes
- **October 30, 2025:** Role-Based Routing Implementation
  - **Unified Admin Routing**: Both ROLE_ADMIN and ROLE_STAFF users now access `/admin/dashboard`
  - **Role Normalization**: Added `UserService.hasRole()` to handle uppercase/lowercase and ROLE_ prefix variations
  - **Updated Route Guards**: All admin route guards now accept both ROLE_ADMIN and ROLE_STAFF
  - **Fixed Navigation**: Dashboard buttons in public layout correctly handle all role variations
  - **JSX Syntax Fix**: Refactored wajooba-public-layout to extract helper function for better esbuild compatibility
  - All changes architect-reviewed and verified working

- **October 30, 2025:** Initial Replit setup & Authentication Fix
  - Configured Vite to use port 5000 with host 0.0.0.0
  - Added `allowedHosts: true` to Vite config (required for Replit proxy)
  - Disabled HMR to fix continuous refresh issue
  - Set up development workflow
  - Configured autoscale deployment
  - **CRITICAL BUG FIX**: Fixed token storage mismatch in `api.ts`
    - Changed from localStorage to cookies to match `authService.ts`
    - This ensures authenticated API calls now correctly include the Authorization header
  - Verified complete authentication flow works end-to-end
