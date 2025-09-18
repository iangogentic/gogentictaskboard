import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // During build time, DATABASE_URL might not be available
  // Return a dummy client that will be replaced at runtime
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found, using placeholder for build");
    // Return undefined during build, will be created at runtime
    return undefined as any;
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Lazy initialization to avoid build-time crashes
let _prisma: PrismaClient | undefined;

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (!_prisma && process.env.DATABASE_URL) {
      _prisma = g.prisma ?? createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        g.prisma = _prisma;
      }
    }

    if (!_prisma) {
      throw new Error(
        "Database connection not initialized. Please ensure DATABASE_URL is set."
      );
    }

    return Reflect.get(_prisma, prop, receiver);
  },
});

export default prisma;
