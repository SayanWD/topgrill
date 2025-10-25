import { createServerSupabaseClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'analyst' | 'viewer'

export interface RBACConfig {
  roles: Record<UserRole, string[]>
}

/**
 * Role-based access control utilities
 */

const permissions: RBACConfig = {
  roles: {
    admin: [
      'users:read',
      'users:write',
      'users:delete',
      'contacts:read',
      'contacts:write',
      'contacts:delete',
      'deals:read',
      'deals:write',
      'deals:delete',
      'analytics:read',
      'settings:write',
    ],
    analyst: [
      'users:read',
      'contacts:read',
      'contacts:write',
      'deals:read',
      'deals:write',
      'analytics:read',
    ],
    viewer: ['contacts:read', 'deals:read', 'analytics:read'],
  },
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (profile as any)?.role || null
}

/**
 * Check if user has permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const role = await getCurrentUserRole()
  if (!role) return false

  return permissions.roles[role].includes(permission)
}

/**
 * Check if user has specific role
 */
export async function hasRole(
  requiredRole: UserRole | UserRole[]
): Promise<boolean> {
  const role = await getCurrentUserRole()
  if (!role) return false

  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return required.includes(role)
}

/**
 * Require specific role or throw
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const hasRequiredRole = await hasRole(role)
  if (!hasRequiredRole) {
    throw new Error('Insufficient permissions')
  }
}

/**
 * Require permission or throw
 */
export async function requirePermission(permission: string) {
  const allowed = await hasPermission(permission)
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

