import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export type UserRole = 'admin' | 'pm' | 'developer' | 'client' | 'user'

interface RolePermissions {
  canCreateProjects: boolean
  canEditAllProjects: boolean
  canDeleteProjects: boolean
  canViewAllProjects: boolean
  canManageUsers: boolean
  canAccessAnalytics: boolean
  canManageIntegrations: boolean
  canViewAuditLogs: boolean
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateProjects: true,
    canEditAllProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    canManageUsers: true,
    canAccessAnalytics: true,
    canManageIntegrations: true,
    canViewAuditLogs: true,
  },
  pm: {
    canCreateProjects: true,
    canEditAllProjects: false, // Only their own
    canDeleteProjects: false,
    canViewAllProjects: true,
    canManageUsers: false,
    canAccessAnalytics: true,
    canManageIntegrations: true,
    canViewAuditLogs: true,
  },
  developer: {
    canCreateProjects: false,
    canEditAllProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false, // Only assigned
    canManageUsers: false,
    canAccessAnalytics: false,
    canManageIntegrations: false,
    canViewAuditLogs: false,
  },
  client: {
    canCreateProjects: false,
    canEditAllProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false, // Only their own via share link
    canManageUsers: false,
    canAccessAnalytics: false,
    canManageIntegrations: false,
    canViewAuditLogs: false,
  },
  user: {
    canCreateProjects: false,
    canEditAllProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canManageUsers: false,
    canAccessAnalytics: false,
    canManageIntegrations: false,
    canViewAuditLogs: false,
  },
}

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[role]?.[permission] || false
}

export async function checkProjectAccess(
  userId: string,
  projectId: string,
  action: 'view' | 'edit' | 'delete'
): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma')
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projectsAsPM: { where: { id: projectId } },
      projectsAsDev: { where: { id: projectId } },
    },
  })

  if (!user) return false

  const role = user.role as UserRole
  
  // Admins can do anything
  if (role === 'admin') return true

  // Check if user is PM of the project
  const isPM = user.projectsAsPM.length > 0
  
  // Check if user is developer on the project
  const isDev = user.projectsAsDev.length > 0

  switch (action) {
    case 'view':
      return isPM || isDev || (role === 'pm' && hasPermission(role, 'canViewAllProjects'))
    case 'edit':
      return isPM
    case 'delete':
      return hasPermission(role, 'canDeleteProjects')
    default:
      return false
  }
}

export async function requireAuth(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return session
}

export async function requireRole(req: NextRequest, allowedRoles: UserRole[]) {
  const session = await requireAuth(req)
  
  if ('status' in session) {
    return session // Return the error response
  }

  const userRole = session.user.role as UserRole

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  return session
}

export async function logAuditAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  payload?: any,
  status: 'planned' | 'executed' | 'failed' = 'executed',
  error?: string
) {
  const { prisma } = await import('@/lib/prisma')
  
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        payload: payload || {},
        status,
        error,
      },
    })
  } catch (err) {
    console.error('Failed to log audit action:', err)
  }
}