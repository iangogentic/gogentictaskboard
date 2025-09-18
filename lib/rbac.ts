import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Role = "admin" | "pm" | "developer" | "client" | "user";

export const permissions = {
  admin: ["*"],
  pm: [
    "write:projects",
    "read:projects",
    "write:tasks",
    "read:tasks",
    "write:documents",
    "read:documents",
    "write:updates",
    "read:updates",
    "slack:send",
    "slack:manage",
    "drive:write",
    "drive:read",
    "integration:manage",
    "agent:use",
  ],
  developer: [
    "read:projects",
    "write:tasks",
    "read:tasks",
    "write:documents",
    "read:documents",
    "write:updates",
    "read:updates",
    "slack:send",
    "drive:read",
    "agent:use",
  ],
  client: ["read:projects", "read:tasks", "read:documents", "read:updates"],
  user: ["read:projects", "read:tasks", "read:documents", "read:updates"],
};

export async function hasPermission(
  userRole: Role,
  permission: string
): Promise<boolean> {
  const rolePermissions = permissions[userRole] || [];

  // Admin has all permissions
  if (rolePermissions.includes("*")) return true;

  // Check specific permission
  return rolePermissions.includes(permission);
}

export async function requirePermission(permission: string) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    throw new Error("Unauthorized: Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("Unauthorized: User not found");
  }

  const allowed = await hasPermission(user.role as Role, permission);

  if (!allowed) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }

  return user;
}

export async function getUserRole(email: string): Promise<Role | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  return user?.role as Role | null;
}

export async function canUserModifyProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "admin") return true;

  // Check if user is project member with appropriate role
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ProjectMember: {
        where: { userId },
      },
    },
  });

  if (!project) return false;

  // PMs and developers can modify projects they're members of
  if (user?.role === "pm" || user?.role === "developer") {
    return project.ProjectMember.length > 0;
  }

  return false;
}

export async function checkPermissions(
  userOrId: string | { id: string; role: string } | null,
  requiredScopes: string[] | string
): Promise<boolean> {
  // Handle different input types
  let user: { role: string } | null = null;

  if (!userOrId) return false;

  if (typeof userOrId === "string") {
    const dbUser = await prisma.user.findUnique({
      where: { id: userOrId },
      select: { role: true },
    });
    user = dbUser;
  } else {
    user = userOrId;
  }

  if (!user) return false;

  // Convert single scope to array
  const scopes = Array.isArray(requiredScopes)
    ? requiredScopes
    : [requiredScopes];

  // Check each required scope
  for (const scope of scopes) {
    const permission = scope.includes(":") ? scope : `${scope}:*`;
    const hasIt = await hasPermission(user.role as Role, permission);
    if (!hasIt) return false;
  }

  return true;
}
