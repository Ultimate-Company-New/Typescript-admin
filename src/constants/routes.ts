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
    GROUPS: '/dashboard/groups',
    ADD_GROUPS: '/dashboard/groups/add',
    IMPORT_GROUPS: '/dashboard/groups/import',
    LEADS: '/dashboard/leads',
    ADD_LEAD: '/dashboard/leads/add',
    IMPORT_LEADS: '/dashboard/leads/import',
    PROMOS: '/dashboard/promos',
    ADD_PROMO: '/dashboard/promos/add',
    IMPORT_PROMOS: '/dashboard/promos/import',
    PRODUCTS: '/dashboard/products',
    ADD_PRODUCT: '/dashboard/products/add',
    IMPORT_PRODUCTS: '/dashboard/products/import',
    PACKAGES: '/dashboard/packages',
    ADD_PACKAGE: '/dashboard/packages/add',
    IMPORT_PACKAGES: '/dashboard/packages/import',
    PICKUP_LOCATIONS: '/dashboard/pickup-locations',
    ADD_PICKUP_LOCATION: '/dashboard/pickup-locations/add',
    IMPORT_PICKUP_LOCATIONS: '/dashboard/pickup-locations/import',
    PURCHASE_ORDERS: '/dashboard/purchase-orders',
    ADD_PURCHASE_ORDER: '/dashboard/purchase-orders/add',
    IMPORT_PURCHASE_ORDERS: '/dashboard/purchase-orders/import',
    MESSAGES: '/dashboard/messages',
    ADD_MESSAGE: '/dashboard/messages/add',
    IMPORT_MESSAGES: '/dashboard/messages/import',
    WEB_TEMPLATES: '/dashboard/web-templates',
    ADD_WEB_TEMPLATE: '/dashboard/web-templates/add',
    IMPORT_WEB_TEMPLATES: '/dashboard/web-templates/import',
    SALES_ORDERS: '/dashboard/sales-orders',
    ADD_SALES_ORDER: '/dashboard/sales-orders/add',
    SETTINGS: '/dashboard/settings',
    SUPPORT: '/dashboard/support',
    DEVELOPER_DOCS: '/dashboard/developer-docs',
    TODO: '/dashboard/todo',
    CALENDAR: '/dashboard/calendar',
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

