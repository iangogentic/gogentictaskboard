import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// For Edge runtime (middleware), export OAuth-only config
export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // GitHub provider removed - credentials not configured
  ],
} satisfies NextAuthConfig;
