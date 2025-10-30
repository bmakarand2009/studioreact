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

## Recent Changes
- **October 30, 2025:** Initial Replit setup
  - Configured Vite to use port 5000 with host 0.0.0.0
  - Set up development workflow
  - Configured autoscale deployment
  - Verified app loads correctly and connects to external API
