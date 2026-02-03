# Wisely-React Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd wisely-react

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### CORS and API proxy (development)

When running locally, the app talks to `https://api.wajooba.me`. Browsers block these requests (CORS) if the API does not allow your origin. To avoid that, the dev server proxies API calls:

- **`.env.development`** sets `VITE_API_URL=/api`.
- **`vite.config.ts`** proxies `/api` to `https://api.wajooba.me` (path prefix `/api` is removed).
- All API requests from the app go to the same origin (e.g. `http://localhost:5173/api/...`) and Vite forwards them to the backend.

To call the API directly (e.g. if the backend allows your origin), set `VITE_API_URL=https://api.wajooba.me` in `.env.development` or `.env.development.local`.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (public)/          # Public-facing routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/             # Reusable components
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── hooks/                  # Custom React hooks
├── services/               # API services
├── stores/                 # Zustand stores
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── constants/              # Application constants
└── styles/                 # Component styles
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19 with Server Components
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS v4 + CSS Modules
- **UI Library**: Material-UI (MUI) v6
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios

## 📝 Development Workflow

### 1. Component Development
- Use atomic design principles
- Create components in appropriate directories
- Follow naming conventions: PascalCase for components
- Include TypeScript interfaces for props

### 2. State Management
- Use Zustand for global state
- Keep stores focused and minimal
- Use React Query for server state
- Implement optimistic updates where appropriate

### 3. API Integration
- Use the centralized API service
- Implement proper error handling
- Use React Query for caching and synchronization
- Follow RESTful conventions

### 4. Styling
- Use Tailwind CSS for utility classes
- Create component-specific styles with CSS Modules
- Follow design system tokens
- Ensure responsive design

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Testing Strategy
- Unit tests for utilities and hooks
- Component tests with React Testing Library
- Integration tests for API services
- E2E tests for critical user flows

## 📦 Building & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Create a `.env.local` file with:
```
NEXT_PUBLIC_API_URL=https://api.wajooba.me
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=Wisely-React
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🔧 Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check

# Dependencies
npm install          # Install dependencies
npm update           # Update dependencies
npm audit            # Security audit
npm audit fix        # Fix security issues
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Query Documentation](https://tanstack.com/query)

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - Run `npm run type-check`
   - Check import paths and type definitions

2. **Build Errors**
   - Clear `.next` folder
   - Check environment variables
   - Verify all dependencies are installed

3. **Styling Issues**
   - Check Tailwind CSS configuration
   - Verify CSS Modules are properly configured
   - Check for conflicting styles

4. **API Issues**
   - Verify API endpoint configuration
   - Check authentication tokens
   - Review network requests in browser dev tools

## 🤝 Contributing

1. Create a feature branch
2. Follow coding standards
3. Write tests for new features
4. Update documentation
5. Submit a pull request

## 📞 Support

For development questions or issues:
- Check the project documentation
- Review existing issues
- Create a new issue with detailed information
- Contact the development team
