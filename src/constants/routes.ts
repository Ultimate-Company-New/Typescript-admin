/**
 * Application route constants
 * Centralized route definitions for easy maintenance
 */

export const APP_ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  CLIENT_LANDING: '/client-landing',
  CONFIRM_EMAIL: '/confirm-email',
  NOT_FOUND: '/404',
  
  // Dashboard routes
  DASHBOARD: {
    ROOT: '/dashboard',
    USERS: '/dashboard/users',
    ADD_USERS: '/dashboard/users/add',
    IMPORT_USERS: '/dashboard/users/import',
    TODO: '/dashboard/todo',
    CALENDAR: '/dashboard/calendar',
    MESSAGES: '/dashboard/messages',
    NOTIFICATIONS: '/dashboard/notifications',
  },
} as const

/**
 * Helper function to get the last part of a route
 * @param route - Full route path
 * @returns Last segment of the route
 */
export const getLastPartFromRoute = (route: string): string => {
  const parts = route.split('/')
  return parts[parts.length - 1]
}

