import NextAuth from "next-auth"
import authConfig from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthRoute = nextUrl.pathname.startsWith('/login') || 
                      nextUrl.pathname.startsWith('/register')
  const isPublicRoute = nextUrl.pathname.startsWith('/api/auth')
  const isAdminRoute = nextUrl.pathname.startsWith('/api/admin')
  const isProbeRoute = nextUrl.pathname.startsWith('/api/probe')

  // Allow admin routes when AUTH_DEBUG is true and proper key is provided
  if (isAdminRoute) {
    return null // Let the route handler check the auth
  }

  // Allow probe routes temporarily for debugging
  if (isProbeRoute) {
    return null
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', nextUrl))
  }

  // Redirect non-logged-in users to login page (including root)
  if (!isLoggedIn && !isAuthRoute && !isPublicRoute) {
    return Response.redirect(new URL('/login', nextUrl))
  }

  return null
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};