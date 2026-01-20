import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle authentication redirects
 *
 * - Redirect authenticated users away from auth pages to dashboard
 * - Redirect unauthenticated users trying to access protected routes to login
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/docs'];

  // Auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ['/auth/login', '/auth/register'];

  // Check if accessing protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Check if accessing auth routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
