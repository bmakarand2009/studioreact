import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['ROLE_ADMIN'],
  '/admin/dashboard': ['ROLE_ADMIN'],
  '/student': ['ROLE_STUDENT'],
  '/student/dashboard': ['ROLE_STUDENT'],
  '/staff': ['ROLE_STAFF'],
  '/staff/dashboard': ['ROLE_STAFF'],
  '/dashboard': ['ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_STAFF'],
};

// Define public routes that don't need authentication
const publicRoutes = ['/login', '/forgot-password', '/sign-up', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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

  // Get token from cookies (primary) or authorization header (fallback)
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectURL', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For role-based protection, we'd need to validate the token
  // This is better handled in the page components or API routes
  // Middleware is best for basic auth checks
  
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
