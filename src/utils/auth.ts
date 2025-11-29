/**
 * Authentication utility functions
 */

interface JWTPayload {
  userId?: number
  sub?: string
  email?: string
  clientId?: number
  exp?: number
  iat?: number
}

/**
 * Decode JWT token without verification (client-side only)
 * Note: This does NOT verify the token signature, only decodes the payload
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${  (`00${  c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    )

    return JSON.parse(jsonPayload) as JWTPayload
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for JWT decode failures
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Get current user ID from stored auth token
 */
export const getCurrentUserId = (): number | null => {
  const token = localStorage.getItem('authToken')
  if (!token) return null

  const payload = decodeJWT(token)
  return payload?.userId ?? null
}

/**
 * Get current client ID from stored auth token
 */
export const getCurrentClientId = (): number | null => {
  const token = localStorage.getItem('authToken')
  if (!token) return null

  const payload = decodeJWT(token)
  return payload?.clientId ?? null
}

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token)
  if (!payload?.exp) return true

  // exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000
}
