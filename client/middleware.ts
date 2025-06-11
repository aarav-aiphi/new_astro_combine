import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Temporarily bypass cookie authentication since cookies aren't working
  // Authentication is now handled at the component level using localStorage
  console.log("🛡️ Middleware bypassed - authentication handled at component level");
  console.log("🛡️ Request path:", request.nextUrl.pathname);
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat-with-astrologer/:path*',
  ],
};