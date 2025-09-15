import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Role = "admin" | "pm" | "developer" | "client" | "user";

export const permissions = {
  admin: ["*"],
  pm: [
    "project:create",
    "project:update",
    "project:delete",
    "task:create",
    "task:update",
    "task:delete",
    "update:create",
    "integration:manage",
    "agent:use",
  ],
  developer: [
    "project:view",
    "task:create",
    "task:update",
    "update:create",
    "agent:use",
  ],
  client: ["project:view", "update:view"],
  user: ["project:view"],
};

export async function hasPermission(
  userRole: Role,
  permission: string
): boolean {
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
      members: {
        where: { userId },
      },
    },
  });

  if (!project) return false;

  // PMs and developers can modify projects they're members of
  if (user?.role === "pm" || user?.role === "developer") {
    return project.members.length > 0;
  }

  return false;
}

export async function checkPermissions(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  const permission = `${resource}:${action}`;
  return hasPermission(user.role as Role, permission);
}
