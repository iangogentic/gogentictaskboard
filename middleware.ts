import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");
  const isPublicRoute =
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/api/agent/chat"); // Allow public access to chat API
  const isAdminRoute = nextUrl.pathname.startsWith("/api/admin");
  const isProbeRoute = nextUrl.pathname.startsWith("/api/probe");
  const isTestRoute =
    nextUrl.pathname.startsWith("/test-error") ||
    nextUrl.pathname.startsWith("/api/test-sentry");

  // Create response that will be used for all paths
  const response = NextResponse.next();

  // Nuke legacy cookies in production so no code can rely on them
  if (process.env.NODE_ENV === "production") {
    response.headers.append(
      "Set-Cookie",
      "currentUser=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
    );
    response.headers.append(
      "Set-Cookie",
      "demo-user=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
    );
    response.headers.append(
      "Set-Cookie",
      "user-switcher=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
    );
  }

  // Allow admin routes when AUTH_DEBUG is true and proper key is provided
  if (isAdminRoute) {
    return response; // Let the route handler check the auth
  }

  // Allow probe routes temporarily for debugging
  if (isProbeRoute) {
    return response;
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", nextUrl)
    );
    // Also clear cookies on redirects
    if (process.env.NODE_ENV === "production") {
      redirectResponse.headers.append(
        "Set-Cookie",
        "currentUser=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      );
      redirectResponse.headers.append(
        "Set-Cookie",
        "demo-user=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      );
      redirectResponse.headers.append(
        "Set-Cookie",
        "user-switcher=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      );
    }
    return redirectResponse;
  }

  // Redirect non-logged-in users to login page (including root)
  if (!isLoggedIn && !isAuthRoute && !isPublicRoute && !isTestRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/login", nextUrl));
    // Also clear cookies on redirects
    if (process.env.NODE_ENV === "production") {
      redirectResponse.headers.append(
        "Set-Cookie",
        "currentUser=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      );
      redirectResponse.headers.append(
        "Set-Cookie",
        "demo-user=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      );
      redirectResponse.headers.append(
        "Set-Cookie",
        "user-switcher=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      );
    }
    return redirectResponse;
  }

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
