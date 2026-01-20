import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle basic routing
 *
 * Note: Authentication checks are handled client-side since tokens are stored in localStorage.
 * The middleware can be extended to check for auth cookies if the backend sets them.
 */
export function middleware(request: NextRequest) {
    // Middleware can be extended here for server-side auth checks
    // Currently, auth is handled client-side via localStorage and protected routes
    
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
