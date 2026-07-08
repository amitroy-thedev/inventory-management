import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware ensures database is initialized before API requests
export function middleware(request: NextRequest) {
  // Just pass through - database will auto-initialize via getDb() calls
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
};
