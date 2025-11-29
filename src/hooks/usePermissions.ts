import { useMemo } from 'react'

/**
 * Custom hook to check user permissions
 * Reads permissions from sessionStorage and provides helper functions
 */
export const usePermissions = (): {
  userPermissions: string[]
  hasPermission: (permissionCode: string) => boolean
  hasAnyPermission: (permissionCodes: string[]) => boolean
  hasAllPermissions: (permissionCodes: string[]) => boolean
} => {
  const userPermissions = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('userPermissions')
      if (!stored) return []
      const parsed: unknown = JSON.parse(stored)
      // Ensure it's always an array
      return Array.isArray(parsed) ? (parsed as string[]) : []
    } catch {
      return []
    }
  }, [])

  const hasPermission = (permissionCode: string): boolean => userPermissions.includes(permissionCode)

  const hasAnyPermission = (permissionCodes: string[]): boolean =>
    permissionCodes.some(code => userPermissions.includes(code))

  const hasAllPermissions = (permissionCodes: string[]): boolean =>
    permissionCodes.every(code => userPermissions.includes(code))

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
