import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface RequestUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  source: "nextauth" | "mcp";
}

export async function resolveRequestUser(
  req: NextRequest
): Promise<RequestUser | null> {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      source: "nextauth",
    };
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    try {
      const secret = process.env.MCP_JWT_SECRET;
      if (!secret) {
        throw new Error("MCP_JWT_SECRET is not configured");
      }
      const payload = jwt.verify(token, secret) as {
        sub: string;
        email: string;
        name?: string;
        role?: string;
      };

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        source: "mcp",
      };
    } catch (error) {
      console.error("Failed to verify MCP token", error);
      return null;
    }
  }

  return null;
}
