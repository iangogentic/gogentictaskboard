import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC = [/^\/$/, /^\/share\//, /^\/api\/health/, /^\/_next\//, /^\/favicon/];

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  
  // Allow public routes
  if (PUBLIC.some(r => r.test(url.pathname))) {
    return NextResponse.next();
  }

  // Check for existing auth cookie
  const has = (req.headers.get('cookie') || '').includes('gp=1');
  if (has) return NextResponse.next();

  // Check for password in query params
  const pass = url.searchParams.get('pass');
  if (pass && pass === process.env.APP_PASSWORD) {
    const res = NextResponse.redirect(url.origin + url.pathname);
    res.headers.append('Set-Cookie','gp=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000');
    return res;
  }
  
  // Unauthorized
  return new NextResponse('Locked. Append ?pass=YOUR_PASS once.', { status: 401 });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check)
     * - share (public share pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/health|share|_next/static|_next/image|favicon.ico).*)',
  ],
};