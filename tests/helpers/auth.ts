import { test as base, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

// Mock user for testing
export const testUser = {
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  role: "admin",
};

// Create authenticated test context
export const test = base.extend({
  storageState: async ({}, use) => {
    // Create a mock JWT token
    const token = jwt.sign(
      {
        sub: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      },
      process.env.NEXTAUTH_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    // Create storage state with auth token
    const storageState = {
      cookies: [
        {
          name: "next-auth.session-token",
          value: token,
          domain: "localhost",
          path: "/",
          expires: Date.now() / 1000 + 3600,
          httpOnly: true,
          secure: false,
          sameSite: "Lax" as const,
        },
      ],
      origins: [],
    };

    await use(storageState);
  },
});

// Helper to create API context with auth headers
export async function createAuthenticatedAPIContext(page: any) {
  const token = jwt.sign(
    {
      sub: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
    },
    process.env.NEXTAUTH_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

// Helper to bypass auth for API testing
export async function authenticatedRequest(
  page: any,
  url: string,
  options: any = {}
) {
  const authContext = await createAuthenticatedAPIContext(page);

  return page.request.fetch(url, {
    ...options,
    headers: {
      ...authContext.headers,
      ...options.headers,
    },
  });
}

export { expect };
