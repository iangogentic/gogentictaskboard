import { auth } from "@/auth";
import { getServerSession } from "next-auth";

// Export auth directly from the main auth file
export { auth } from "@/auth";

// For backwards compatibility with old code that uses authOptions
export const authOptions = {
  // This is a compatibility shim for NextAuth v5
  // The actual auth is handled by the auth() function from @/auth
};

// Helper function to get current user
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}
