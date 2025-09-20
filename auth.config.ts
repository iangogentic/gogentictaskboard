import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// For Edge runtime (middleware), export OAuth-only config
// Credentials provider moved to auth.ts to avoid Edge Runtime issues
export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
} satisfies NextAuthConfig;
