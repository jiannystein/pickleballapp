import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/auth/login' || path === '/auth/register' || path === '/';

  // Define protected paths that require authentication
  const isProtectedPath = path.startsWith('/sessions') || 
                         path.startsWith('/profile') || 
                         path.startsWith('/locations');
  
  // Define admin paths that require admin privileges
  const isAdminPath = path.startsWith('/admin');

  const token = request.cookies.get('token')?.value;
  const verifiedToken = token && await verifyJWT(token);

  // Redirect to login if accessing protected route without valid token
  if ((isProtectedPath || isAdminPath) && !verifiedToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect to sessions if accessing auth pages with valid token
  if (isPublicPath && verifiedToken) {
    return NextResponse.redirect(new URL('/sessions', request.url));
  }

  // Redirect non-admin users trying to access admin pages
  if (isAdminPath && verifiedToken && !verifiedToken.isAdmin) {
    return NextResponse.redirect(new URL('/sessions', request.url));
  }

  return NextResponse.next();
}

// Configure paths that trigger the middleware
export const config = {
  matcher: [
    '/',
    '/auth/login',
    '/auth/register',
    '/sessions/:path*',
    '/profile/:path*',
    '/locations/:path*',
    '/admin/:path*',
  ],
}; 