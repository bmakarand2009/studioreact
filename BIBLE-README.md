# WISELY-REACT: Enterprise-Grade Learning Management System

## 🎯 Project Overview
**Project**: Conversion of Angular 13 application (v5byclasses) to modern React application  
**Goal**: Build enterprise-grade, centralized, redundancy-free learning management system  
**Status**: Planning & Architecture Phase  
**Target**: Production-ready, maintainable, scalable React application

---

## 🎨 **BRAND IDENTITY & COLORS**
**Primary Brand Colors:**
- **Deep Blue**: `#0055a6` - **PRIMARY** brand color, used for main buttons and primary actions
- **Cyan**: `#00c6d8` - **SECONDARY** brand color, used for secondary actions and interactive elements
- **Orange**: `#ff8854` - **TERTIARY** brand color, used for tertiary actions and warm highlights
- **Red**: `#ff1a00` - **ACCENT** brand color, used for alerts and important elements

**Color Usage Guidelines:**
- Use `#0055a6` (Deep Blue) for primary buttons, main CTAs, and primary brand elements
- Use `#00c6d8` (Cyan) for secondary buttons, interactive elements, and secondary actions
- Use `#ff8854` (Orange) for tertiary buttons, warm highlights, and supporting actions
- Use `#ff1a00` (Red) for error states, destructive actions, and critical information

**Design Philosophy:**
- **Professional & Smooth**: Subtle, professional border radius (rounded-lg) for a modern, polished feel
- **Deep Blue Primary**: Professional deep blue (#0055a6) as the main action color
- **Cyan Secondary**: Fresh cyan (#00c6d8) for secondary actions and interactive elements
- **Smooth Transitions**: All interactions use smooth animations and transitions
- **Fuse-18 Inspired**: Maintains the professional design principles from fuse-18

---

## 🏗️ Current Angular Application Analysis (v5byclasses)

### **Application Scale & Complexity**
- **Size**: Large enterprise application (~50+ modules)
- **Lines of Code**: Estimated 100,000+ lines
- **Architecture**: Multi-tenant, role-based access control
- **State Management**: RxJS BehaviorSubject pattern (not NgRx)
- **User Base**: Multi-organization, multi-role system

### **Technical Debt & Issues**
- **Angular Version**: 13 (outdated, security vulnerabilities)
- **Maintenance**: Difficult to update and maintain
- **Code Quality**: Not production-grade
- **Redundancy**: Duplicate code patterns
- **Performance**: Bundle size issues, slow builds

---

## 🎯 Target React Application Requirements

### **Architecture Principles**
1. **Enterprise-Grade**: Production-ready, scalable, maintainable
2. **Centralized**: Single source of truth, consistent patterns
3. **Redundancy-Free**: DRY principles, shared components
4. **Modern Stack**: Latest React patterns, TypeScript, best practices
5. **Performance**: Fast builds, optimized bundles, lazy loading
6. **Pure Frontend**: No backend dependencies, external API integration only

### **Framework Choice: Next.js 15**
- **Reasoning**: Latest stable version with React 19 support
- **Benefits**: 
  - React 19 features and performance improvements
  - Enhanced App Router stability
  - Better TypeScript support
  - Improved build optimization
  - Partial Prerendering for better performance
- **Scalability**: Handles 50+ modules efficiently
- **Production**: Superior build optimization and deployment

---

## 🌐 **Pure Frontend Architecture**
**Key Principle**: This is a pure frontend application with no backend dependencies.

### **Environment Configuration:**
- **Development**: `https://api.wajooba.me` - Local development and testing
- **Staging**: `https://api.wajooba.xyz` - Pre-production testing and QA
- **Production**: `https://api.onwajooba.com` - Live production environment

### **Environment Variables:**
```bash
# Set environment explicitly
NEXT_PUBLIC_ENV=staging    # Forces staging environment
NEXT_PUBLIC_ENV=production # Forces production environment

# OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_DOMAIN=your_google_domain
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=your_facebook_client_id
NEXT_PUBLIC_FACEBOOK_DOMAIN=your_facebook_domain
```

### **External API Integration:**
- **Authentication**: Integrates with external auth APIs (https://api.wajooba.me)
- **Data Services**: All data comes from external REST APIs
- **No Mock APIs**: Real API calls only, no development mocks
- **No Backend Code**: Pure React/Next.js frontend application

### **API Endpoints:**
- `POST /public/user/signin` - User authentication
- `POST /public/user/logout` - User logout
- `POST /rest/user/forgotPassword` - Password reset
- `GET /rest/reInitInfo` - Session validation
- `POST /public/authToken` - OAuth token exchange

---

## **🔐 AUTHENTICATION & OAUTH**

### **Core Authentication**
- **AuthService**: Centralized authentication service matching `wisely-ui` pattern
- **Token Storage**: Only `accessToken` stored in localStorage (no user data)
- **User Data**: Stored in memory (service instance) for performance
- **API Integration**: Direct calls to external APIs (`/public/user/signin`, `/rest/reInitInfo`)

### **Google OAuth Implementation**
- **OAuth Flow**: Backend-driven OAuth flow matching `v5byclasses` implementation
- **Configuration**: Backend provides redirect URLs dynamically
- **Callback Handling**: Automatic OAuth callback detection and token exchange
- **Integration**: Seamless integration with existing authentication system

### **OAuth Configuration**
```typescript
// Backend endpoints (matching v5byclasses)
- POST /authmgr/pauth/glogin - Get Google OAuth redirect URL
- POST /authmgr/pauth/flogin - Get Facebook OAuth redirect URL  
- POST /public/authToken - Exchange OAuth token for system token
```

### **OAuth Flow (v5byclasses Pattern)**
1. **User clicks "Continue with Google"** → Backend call to `/authmgr/pauth/glogin`
2. **Backend returns redirect URL** → Dynamically generated OAuth URL
3. **User redirected to OAuth** → Google handles authentication
4. **OAuth callback** → Returns to app with `auth` token in query params
5. **Token exchange** → Call `/public/authToken` to get system token
6. **Authentication complete** → User logged in with system token
7. **User data fetched** → From `/rest/reInitInfo` using system token

---

## 👥 User Roles & Access Control

### **Role Hierarchy**
```
Public User (Unauthenticated)
├── Calendar Access
├── Course Catalog
├── Event Viewing
├── Registration Forms
└── Donation System

Student (Authenticated)
├── My Courses
├── Assessments
├── Registration Management
├── File Access
├── Schedule Viewing
└── Donation History

Admin/Staff (Authenticated)
├── Full System Management
├── User Management
├── Content Management
├── Analytics & Reports
├── Tenant Management
└── System Configuration
```

### **Multi-Tenant Architecture**
- **Organization Isolation**: Each org has separate data, users, content
- **Shared Infrastructure**: Common components, shared services
- **Customization**: Per-tenant branding, features, configurations

---

## 📱 Core Feature Modules

### **1. Authentication & Authorization**
- **JWT Authentication**: Secure token-based auth via external APIs
- **OAuth Integration**: Google, Microsoft, social logins
- **Role-Based Access Control**: Dynamic permissions
- **Multi-tenant Auth**: Organization-based user management
- **Session Management**: Secure, persistent sessions

### **2. User Management**
- **User Profiles**: Comprehensive user data management
- **Contact Management**: Customer relationship system
- **Role Assignment**: Dynamic role management
- **Permission System**: Granular access control

### **3. Learning Management**
- **Course Management**: Create, edit, organize courses
- **Content Management**: Rich media, documents, videos
- **Assessment System**: Tests, quizzes, assignments
- **Progress Tracking**: Learning analytics, completion tracking
- **SCORM Support**: eLearning standard compliance

### **4. Event & Calendar System**
- **Event Management**: Create, schedule, manage events
- **Calendar Integration**: Multiple calendar views
- **Registration System**: Event sign-ups, capacity management
- **Notification System**: Automated reminders, updates

### **5. E-Commerce & Payments**
- **Product Store**: Course sales, merchandise
- **Payment Processing**: Stripe, Paytm integration
- **Checkout System**: Secure payment flow
- **Order Management**: Purchase history, receipts
- **Subscription Plans**: Recurring billing

### **6. Communication & Marketing**
- **Email Campaigns**: Automated email marketing
- **Notification System**: In-app, email, SMS notifications
- **Message Center**: Internal communication system
- **Social Features**: Community, discussions

### **7. Analytics & Reporting**
- **Dashboard Analytics**: Real-time metrics, charts
- **User Analytics**: Behavior tracking, engagement
- **Business Intelligence**: Revenue, performance reports
- **Custom Reports**: Flexible reporting system

### **8. File & Media Management**
- **Document Storage**: Secure file management
- **Media Library**: Images, videos, audio files
- **Cloud Integration**: AWS S3, CDN support
- **Version Control**: File history, rollback capabilities

---

## 🛠️ Technical Architecture

### **Frontend Stack**
```
Next.js 15 (App Router)
├── React 19 (Server Components)
├── TypeScript 5.3+
├── Tailwind CSS + CSS Modules
├── Material-UI (MUI) v6
├── React Hook Form + Zod
├── React Query (TanStack Query)
├── Zustand (State Management)
└── Modern React Patterns
```

### **External API Integration**
```
API Layer
├── RESTful APIs (https://api.wajooba.me)
├── GraphQL (Future consideration)
├── WebSocket (Real-time features)
├── File Upload Services
└── Third-party Integrations
```

### **State Management Strategy**
```
Zustand Stores
├── Auth Store (User, permissions, tokens)
├── UI Store (Theme, navigation, modals)
├── Data Store (Cached API responses)
├── Form Store (Form state management)
└── Feature Stores (Module-specific state)
```

### **Data Flow Architecture**
```
User Action → Component → Hook → Service → External API
     ↓
State Update → UI Re-render → Optimistic Updates
     ↓
Cache Management → Background Sync → Error Handling
```

---

## 📝 Project Structure

### **Directory Organization**
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (public)/          # Public-facing routes
│   ├── api/               # API routes (if needed)
│   └── globals.css        # Global styles
├── components/             # Reusable components
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── hooks/                  # Custom React hooks
├── services/               # External API services
├── stores/                 # Zustand stores
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── constants/              # Application constants
└── styles/                 # Component styles
```

---

## 📋 Development Phases

### **Phase 1: Foundation (Weeks 1-4)**
- [x] Next.js project setup with TypeScript
- [x] Authentication system (JWT, OAuth) via external APIs
- [x] Base UI components and design system with brand colors
- [x] Routing and navigation structure
- [x] State management setup (Zustand)

### **Phase 2: Core Features (Weeks 5-12)**
- [ ] User management system via external APIs
- [ ] Role-based access control
- [ ] Multi-tenant architecture
- [ ] Base dashboard layout
- [ ] API service layer for external services

### **Phase 3: Learning Management (Weeks 13-20)**
- [ ] Course management system
- [ ] Content management
- [ ] Assessment system
- [ ] Progress tracking
- [ ] File management

### **Phase 4: Advanced Features (Weeks 21-28)**
- [ ] E-commerce and payments
- [ ] Event and calendar system
- [ ] Communication tools
- [ ] Analytics and reporting
- [ ] Email campaigns

### **Phase 5: Optimization (Weeks 29-32)**
- [ ] Performance optimization
- [ ] Testing and quality assurance
- [ ] Documentation
- [ ] Deployment and CI/CD
- [ ] Monitoring and analytics

---

## 🔧 Key Technical Decisions

### **1. Component Architecture**
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Composition over Inheritance**: Flexible, reusable components
- **Server Components**: Next.js 14 server-first approach
- **Client Components**: Interactive features only when needed

### **2. Data Fetching Strategy**
- **React Query**: Server state management, caching, synchronization
- **Optimistic Updates**: Better user experience
- **Background Sync**: Automatic data refresh
- **Error Boundaries**: Graceful error handling

### **3. Form Management**
- **React Hook Form**: Performance, validation, accessibility
- **Zod**: Runtime type validation, schema definition
- **Form Builder**: Dynamic form generation system

### **4. Styling Approach**
- **Tailwind CSS**: Utility-first, consistent design system
- **Brand Colors**: Consistent use of #ff8854, #ff1a00, #00c6d8, #0055a6
- **CSS Modules**: Component-scoped styles
- **Design Tokens**: Consistent spacing, colors, typography
- **Responsive Design**: Mobile-first approach

### **5. Testing Strategy**
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **Storybook**: Component documentation and testing

---

## 📊 Performance Requirements

### **Core Web Vitals Targets**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### **Bundle Optimization**
- **Initial Bundle**: < 200KB (gzipped)
- **Lazy Loading**: Route-based code splitting
- **Tree Shaking**: Dead code elimination
- **Image Optimization**: Next.js built-in optimization

### **Caching Strategy**
- **Static Assets**: Long-term caching
- **API Responses**: Intelligent caching with React Query
- **User Data**: Secure, encrypted storage
- **Offline Support**: Progressive Web App features

---

## 🔒 Security Requirements

### **Authentication & Authorization**
- **JWT Tokens**: Secure, time-limited tokens from external APIs
- **Refresh Tokens**: Secure token renewal
- **Role-Based Access**: Granular permission system
- **Multi-factor Authentication**: Enhanced security

### **Data Protection**
- **HTTPS Only**: Secure communication
- **Input Validation**: XSS and injection prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Data Encryption**: Sensitive data encryption

### **Compliance**
- **GDPR**: Data privacy compliance
- **Accessibility**: WCAG 2.1 AA compliance
- **Security Headers**: CSP, HSTS, X-Frame-Options

---

## 📈 Scalability Considerations

### **Horizontal Scaling**
- **Load Balancing**: Multiple server instances
- **CDN**: Global content delivery
- **Database Sharding**: Multi-tenant data separation
- **Microservices**: Future architecture evolution

### **Vertical Scaling**
- **Performance Monitoring**: Real-time metrics
- **Resource Optimization**: Memory and CPU efficiency
- **Caching Layers**: Multiple caching strategies
- **Database Optimization**: Query optimization, indexing

---

## 🚀 Deployment & DevOps

### **Environment Strategy**
- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live application
- **Testing**: Automated testing environment

### **CI/CD Pipeline**
- **Git Workflow**: Feature branches, pull requests
- **Automated Testing**: Unit, integration, E2E tests
- **Build Process**: Optimized production builds
- **Deployment**: Automated deployment to environments

### **Monitoring & Analytics**
- **Performance Monitoring**: Core Web Vitals tracking
- **Error Tracking**: Sentry or similar service
- **User Analytics**: User behavior analysis
- **Business Metrics**: Revenue, engagement tracking

---

## 📚 Documentation Requirements

### **Technical Documentation**
- **API Documentation**: OpenAPI/Swagger specs for external APIs
- **Component Library**: Storybook documentation
- **Architecture Decisions**: ADR (Architecture Decision Records)
- **Setup Guides**: Development environment setup

### **User Documentation**
- **User Manuals**: Feature guides for each role
- **Admin Guides**: System administration
- **API Reference**: Developer documentation
- **Troubleshooting**: Common issues and solutions

---

## 🎯 Success Metrics

### **Technical Metrics**
- **Build Time**: < 5 minutes for production builds
- **Bundle Size**: < 200KB initial bundle
- **Performance Score**: > 90 Lighthouse score
- **Test Coverage**: > 80% code coverage

### **Business Metrics**
- **User Adoption**: Increased user engagement
- **Performance**: Faster page loads, better UX
- **Maintainability**: Reduced development time
- **Scalability**: Support for more users/organizations

---

## 📝 Migration Strategy

### **Parallel Development**
- **Phase 1**: Build new React app alongside Angular
- **Phase 2**: Migrate features one by one
- **Phase 3**: Gradual user migration
- **Phase 4**: Complete Angular deprecation

### **Data Migration**
- **Database**: Maintain existing data structure
- **APIs**: Gradual API modernization
- **User Accounts**: Seamless authentication migration
- **Content**: Preserve all existing content

---

## 📝 Next Steps

### **Immediate Actions**
1. **Set up Next.js project** with recommended stack
2. **Create project structure** following outlined architecture
3. **Set up authentication system** foundation via external APIs
4. **Design system setup** with Tailwind + brand colors
5. **API service layer** structure for external services

### **Short-term Goals (Next 2 weeks)**
- [x] Project initialization and setup
- [x] Authentication system implementation via external APIs
- [x] Base UI component library with brand colors
- [x] Routing and navigation structure
- [x] State management setup

### **Medium-term Goals (Next 2 months)**
- [ ] User management system via external APIs
- [ ] Multi-tenant architecture
- [ ] Core dashboard functionality
- [ ] Basic CRUD operations
- [ ] Testing framework setup

---

## 📞 Support & Resources

### **Development Team**
- **Lead Developer**: [Your Name]
- **UI/UX Designer**: [Designer Name]
- **Backend Developer**: [Backend Developer Name]
- **QA Engineer**: [QA Engineer Name]

### **Tools & Services**
- **Version Control**: Git (GitHub/GitLab)
- **Project Management**: Jira/Asana/Trello
- **Design System**: Figma/Sketch
- **Documentation**: Notion/Confluence
- **Communication**: Slack/Teams

---

## 📝 Notes & Updates

### **Last Updated**: [Current Date]
### **Version**: 1.0
### **Status**: Planning Phase
### **Next Review**: [Next Review Date]

---

*This document serves as the foundation for the Wisely-React project. Update it regularly as the project evolves and new decisions are made.*

## 📋 **How to Use This Document**

1. **Create the file**: Copy the content above and save it as `BIBLE-README.md` in your `wisely-react` folder

2. **Reference in future chats**: Start new conversations by sharing this file or referencing its key points

3. **Keep it updated**: Modify this document as you make architectural decisions and progress through development phases

4. **Share with team**: Use this as the single source of truth for project requirements and architecture

## 🚀 **Next Immediate Actions**

Based on this context, your next steps should be:

1. **Create the BIBLE-README.md file** with the content above
2. **Set up Next.js 15 project** with the recommended tech stack
3. **Initialize the project structure** following the outlined architecture
4. **Begin Phase 1: Foundation** development with brand colors

This document will serve as your project bible and ensure consistency across all development sessions.