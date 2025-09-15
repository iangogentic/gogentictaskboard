import { auth } from "@/auth";

// Export auth directly from the main auth file
export { auth } from "@/auth";

// For backwards compatibility with old code that uses authOptions
export const authOptions = {
  // This is a compatibility shim for NextAuth v5
  // The actual auth is handled by the auth() function from @/auth
};

// Export getServerSession for backwards compatibility
export async function getServerSession() {
  return await auth();
}

// Helper function to get current user
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}
