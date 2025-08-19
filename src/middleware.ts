import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const protectedRoutes = {
  // Admin routes - require ROLE_ADMIN
  '/admin': ['ROLE_ADMIN'],
  '/admin/dashboard': ['ROLE_ADMIN'],
  '/admin/users': ['ROLE_ADMIN'],
  '/admin/courses': ['ROLE_ADMIN'],
  '/admin/settings': ['ROLE_ADMIN'],
  
  // Staff routes - require ROLE_STAFF
  '/staff': ['ROLE_STAFF'],
  '/staff/dashboard': ['ROLE_STAFF'],
  
  // Student routes - require ROLE_STUDENT
  '/student': ['ROLE_STUDENT'],
  '/student/dashboard': ['ROLE_STUDENT'],
  '/student/courses': ['ROLE_STUDENT'],
  '/student/calendar': ['ROLE_STUDENT'],
  '/student/store': ['ROLE_STUDENT'],
  '/student/assessments': ['ROLE_STUDENT'],
  '/student/assignments': ['ROLE_STUDENT'],
  '/student/grades': ['ROLE_STUDENT'],
  
  // Generic dashboard - accessible by all authenticated users
  '/dashboard': ['ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_STAFF'],
};

// Define public routes that don't need authentication
const publicRoutes = [
  '/', 
  '/login', 
  '/forgot-password', 
  '/sign-up', 
  '/courses', 
  '/contact', 
  '/about', 
  '/pricing', 
  '/features'
];

// Define auth routes that redirect authenticated users
const authRoutes = ['/login', '/forgot-password', '/sign-up', '/sign-in'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (primary) or authorization header (fallback)
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Check if it's an auth route (login, signup, etc.)
  if (authRoutes.includes(pathname)) {
    // If user is already authenticated, redirect them to appropriate dashboard
    if (token) {
      // We can't determine role from middleware, so redirect to generic dashboard
      // The dashboard will handle role-based routing
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // Check if it's a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if it's a protected route
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!token) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
