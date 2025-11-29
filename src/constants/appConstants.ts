/**
 * Application-wide constants
 * This file contains constants used throughout the application
 */

/**
 * Address types available in the system
 * These must match the database constraint and backend validation
 * All types are in UPPERCASE to match the database constraint
 */
export const ADDRESS_TYPES = {
  HOME: 'HOME',
  WORK: 'WORK',
  BILLING: 'BILLING',
  SHIPPING: 'SHIPPING',
  OFFICE: 'OFFICE',
  WAREHOUSE: 'WAREHOUSE',
} as const

/**
 * Array of all available address types
 * Useful for dropdowns and address type selection
 */
export const ADDRESS_TYPES_ARRAY: string[] = [
  ADDRESS_TYPES.HOME,
  ADDRESS_TYPES.WORK,
  ADDRESS_TYPES.BILLING,
  ADDRESS_TYPES.SHIPPING,
  ADDRESS_TYPES.OFFICE,
  ADDRESS_TYPES.WAREHOUSE,
]

/**
 * Permission codes available in the system
 * These must match exactly with the permissionCode values in the database Permission table
 * Format: PascalCase (e.g., InsertUser, ViewUser, DeleteAddress)
 */
export const PERMISSIONS = {
  // User Management
  VIEW_USER: 'ViewUser',
  INSERT_USER: 'InsertUser',
  UPDATE_USER: 'UpdateUser',
  DELETE_USER: 'DeleteUser',
  VIEW_GROUPS: 'ViewGroups',
  INSERT_GROUPS: 'InsertGroups',
  UPDATE_GROUPS: 'UpdateGroups',
  DELETE_GROUPS: 'DeleteGroups',
  // Address Management
  VIEW_ADDRESS: 'ViewAddress',
  INSERT_ADDRESS: 'InsertAddress',
  UPDATE_ADDRESS: 'UpdateAddress',
  DELETE_ADDRESS: 'DeleteAddress',
  // Client Management
  VIEW_CLIENT: 'ViewClient',
  INSERT_CLIENT: 'InsertClient',
  UPDATE_CLIENT: 'UpdateClient',
  DELETE_CLIENT: 'DeleteClient',
  // API Management
  VIEW_API_KEYS: 'ViewApiKeys',
  INSERT_API_KEYS: 'InsertApiKeys',
  UPDATE_API_KEYS: 'UpdateApiKeys',
  // Lead Management
  VIEW_LEADS: 'ViewLeads',
  INSERT_LEADS: 'InsertLeads',
  UPDATE_LEADS: 'UpdateLeads',
  TOGGLE_LEADS: 'ToggleLeads',
  // Marketing (Promos)
  VIEW_PROMOS: 'ViewPromos',
  INSERT_PROMOS: 'InsertPromos',
  UPDATE_PROMOS: 'UpdatePromos',
  DELETE_PROMOS: 'DeletePromos',
  // Product Management
  VIEW_PRODUCTS: 'ViewProducts',
  INSERT_PRODUCTS: 'InsertProducts',
  UPDATE_PRODUCTS: 'UpdateProducts',
  DELETE_PRODUCTS: 'DeleteProducts',
  TOGGLE_PRODUCT_AVAILABILITY: 'ToggleProductAvailability',
  TOGGLE_PRODUCT_RETURNS: 'ToggleProductReturns',
  // Package Management
  VIEW_PACKAGES: 'ViewPackages',
  INSERT_PACKAGES: 'InsertPackages',
  UPDATE_PACKAGES: 'UpdatePackages',
  TOGGLE_PACKAGES: 'TogglePackages',
  // Logistics (Pickup Locations)
  VIEW_PICKUP_LOCATIONS: 'ViewPickupLocations',
  INSERT_PICKUP_LOCATIONS: 'InsertPickupLocations',
  UPDATE_PICKUP_LOCATIONS: 'UpdatePickupLocations',
  DELETE_PICKUP_LOCATIONS: 'DeletePickupLocations',
  // Purchase Management
  VIEW_PURCHASE_ORDERS: 'ViewPurchaseOrders',
  INSERT_PURCHASE_ORDERS: 'InsertPurchaseOrders',
  UPDATE_PURCHASE_ORDERS: 'UpdatePurchaseOrders',
  TOGGLE_PURCHASE_ORDERS: 'TogglePurchaseOrders',
  // Sales Management
  VIEW_SALES_ORDERS: 'ViewSalesOrders',
  INSERT_SALES_ORDERS: 'InsertSalesOrders',
  UPDATE_SALES_ORDERS: 'UpdateSalesOrders',
  TOGGLE_SALES_ORDERS: 'ToggleSalesOrders',
  // Order Management
  VIEW_ORDERS: 'ViewOrders',
  INSERT_ORDERS: 'InsertOrders',
  UPDATE_ORDERS: 'UpdateOrders',
  CANCEL_ORDERS: 'CancelOrders',
  // Payment Management
  VIEW_PAYMENTS: 'ViewPayments',
  VIEW_PAYMENT_STATISTICS: 'ViewPaymentStatistics',
  PROCESS_REFUNDS: 'ProcessRefunds',
  // Communication (Messages)
  VIEW_MESSAGES: 'ViewMessages',
  INSERT_MESSAGES: 'InsertMessages',
  UPDATE_MESSAGES: 'UpdateMessages',
  DELETE_MESSAGES: 'DeleteMessages',
  // Event Management
  VIEW_EVENTS: 'ViewEvents',
  INSERT_EVENTS: 'InsertEvents',
  UPDATE_EVENTS: 'UpdateEvents',
  TOGGLE_EVENTS: 'ToggleEvents',
  // Support Management
  VIEW_TICKETS: 'ViewTickets',
  RAISE_TICKETS: 'RaiseTickets',
  EDIT_TICKETS: 'EditTickets',
  DELETE_TICKETS: 'DeleteTickets',
  VIEW_COMMENTS: 'ViewComments',
  POST_COMMENTS: 'PostComments',
  DOWNLOAD_ATTACHMENTS: 'DownloadAttachments',
  // Web Template Management
  VIEW_WEB_TEMPLATE: 'ViewWebTemplate',
  INSERT_WEB_TEMPLATE: 'InsertWebTemplate',
  UPDATE_WEB_TEMPLATE: 'UpdateWebTemplate',
  DEACTIVATE_WEB_TEMPLATE: 'DeactivateWebTemplate',
  DEPLOY_WEB_TEMPLATE: 'DeployWebTemplate',
  // Reporting
  VIEW_ORDER_STATISTICS: 'ViewOrderStatistics',
  // System Admin
  VIEW_LOGS: 'ViewLogs',
} as const

/**
 * User roles available in the system
 * These must match the database constraint and backend UserRole enum
 * All roles are in UPPERCASE to match the database constraint
 */
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
  CUSTOMER: 'CUSTOMER',
  CUSTOM: 'CUSTOM',
} as const

/**
 * Array of all available user roles
 * Useful for dropdowns and role selection
 */
export const USER_ROLES_ARRAY: string[] = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.VIEWER,
  USER_ROLES.CUSTOMER,
  USER_ROLES.CUSTOM,
]

/**
 * Role-based permission codes mapping
 * Defines which permission codes each role should have by default
 * Uses PERMISSIONS constants to ensure consistency across the application
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [USER_ROLES.SUPER_ADMIN]: [
    // Full access to everything - Super Admin has all permissions
    // User Management
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.INSERT_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_GROUPS,
    PERMISSIONS.INSERT_GROUPS,
    PERMISSIONS.UPDATE_GROUPS,
    PERMISSIONS.DELETE_GROUPS,
    // Address Management
    PERMISSIONS.VIEW_ADDRESS,
    PERMISSIONS.INSERT_ADDRESS,
    PERMISSIONS.UPDATE_ADDRESS,
    PERMISSIONS.DELETE_ADDRESS,
    // Client Management
    PERMISSIONS.VIEW_CLIENT,
    PERMISSIONS.INSERT_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.DELETE_CLIENT,
    // API Management
    PERMISSIONS.VIEW_API_KEYS,
    PERMISSIONS.INSERT_API_KEYS,
    PERMISSIONS.UPDATE_API_KEYS,
    // Lead Management
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.INSERT_LEADS,
    PERMISSIONS.UPDATE_LEADS,
    PERMISSIONS.TOGGLE_LEADS,
    // Marketing (Promos)
    PERMISSIONS.VIEW_PROMOS,
    PERMISSIONS.INSERT_PROMOS,
    PERMISSIONS.UPDATE_PROMOS,
    PERMISSIONS.DELETE_PROMOS,
    // Product Management
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.INSERT_PRODUCTS,
    PERMISSIONS.UPDATE_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.TOGGLE_PRODUCT_AVAILABILITY,
    PERMISSIONS.TOGGLE_PRODUCT_RETURNS,
    // Package Management
    PERMISSIONS.VIEW_PACKAGES,
    PERMISSIONS.INSERT_PACKAGES,
    PERMISSIONS.UPDATE_PACKAGES,
    PERMISSIONS.TOGGLE_PACKAGES,
    // Logistics (Pickup Locations)
    PERMISSIONS.VIEW_PICKUP_LOCATIONS,
    PERMISSIONS.INSERT_PICKUP_LOCATIONS,
    PERMISSIONS.UPDATE_PICKUP_LOCATIONS,
    PERMISSIONS.DELETE_PICKUP_LOCATIONS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.INSERT_PURCHASE_ORDERS,
    PERMISSIONS.UPDATE_PURCHASE_ORDERS,
    PERMISSIONS.TOGGLE_PURCHASE_ORDERS,
    // Sales Management
    PERMISSIONS.VIEW_SALES_ORDERS,
    PERMISSIONS.INSERT_SALES_ORDERS,
    PERMISSIONS.UPDATE_SALES_ORDERS,
    PERMISSIONS.TOGGLE_SALES_ORDERS,
    // Order Management
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.INSERT_ORDERS,
    PERMISSIONS.UPDATE_ORDERS,
    PERMISSIONS.CANCEL_ORDERS,
    // Payment Management
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.PROCESS_REFUNDS,
    // Communication (Messages)
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.INSERT_MESSAGES,
    PERMISSIONS.UPDATE_MESSAGES,
    PERMISSIONS.DELETE_MESSAGES,
    // Event Management
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.INSERT_EVENTS,
    PERMISSIONS.UPDATE_EVENTS,
    PERMISSIONS.TOGGLE_EVENTS,
    // Support Management
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.RAISE_TICKETS,
    PERMISSIONS.EDIT_TICKETS,
    PERMISSIONS.DELETE_TICKETS,
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.POST_COMMENTS,
    PERMISSIONS.DOWNLOAD_ATTACHMENTS,
    // Web Template Management
    PERMISSIONS.VIEW_WEB_TEMPLATE,
    PERMISSIONS.INSERT_WEB_TEMPLATE,
    PERMISSIONS.UPDATE_WEB_TEMPLATE,
    PERMISSIONS.DEACTIVATE_WEB_TEMPLATE,
    PERMISSIONS.DEPLOY_WEB_TEMPLATE,
    // Reporting
    PERMISSIONS.VIEW_ORDER_STATISTICS,
    PERMISSIONS.VIEW_PAYMENT_STATISTICS,
    // System Admin
    PERMISSIONS.VIEW_LOGS,
  ],
  [USER_ROLES.ADMIN]: [
    // Admin can do everything except Client Management permissions
    // User Management
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.INSERT_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_GROUPS,
    PERMISSIONS.INSERT_GROUPS,
    PERMISSIONS.UPDATE_GROUPS,
    PERMISSIONS.DELETE_GROUPS,
    // Address Management
    PERMISSIONS.VIEW_ADDRESS,
    PERMISSIONS.INSERT_ADDRESS,
    PERMISSIONS.UPDATE_ADDRESS,
    PERMISSIONS.DELETE_ADDRESS,
    // API Management
    PERMISSIONS.VIEW_API_KEYS,
    PERMISSIONS.INSERT_API_KEYS,
    PERMISSIONS.UPDATE_API_KEYS,
    // Lead Management
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.INSERT_LEADS,
    PERMISSIONS.UPDATE_LEADS,
    PERMISSIONS.TOGGLE_LEADS,
    // Marketing (Promos)
    PERMISSIONS.VIEW_PROMOS,
    PERMISSIONS.INSERT_PROMOS,
    PERMISSIONS.UPDATE_PROMOS,
    PERMISSIONS.DELETE_PROMOS,
    // Product Management
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.INSERT_PRODUCTS,
    PERMISSIONS.UPDATE_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.TOGGLE_PRODUCT_AVAILABILITY,
    PERMISSIONS.TOGGLE_PRODUCT_RETURNS,
    // Package Management
    PERMISSIONS.VIEW_PACKAGES,
    PERMISSIONS.INSERT_PACKAGES,
    PERMISSIONS.UPDATE_PACKAGES,
    PERMISSIONS.TOGGLE_PACKAGES,
    // Logistics (Pickup Locations)
    PERMISSIONS.VIEW_PICKUP_LOCATIONS,
    PERMISSIONS.INSERT_PICKUP_LOCATIONS,
    PERMISSIONS.UPDATE_PICKUP_LOCATIONS,
    PERMISSIONS.DELETE_PICKUP_LOCATIONS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.INSERT_PURCHASE_ORDERS,
    PERMISSIONS.UPDATE_PURCHASE_ORDERS,
    PERMISSIONS.TOGGLE_PURCHASE_ORDERS,
    // Sales Management
    PERMISSIONS.VIEW_SALES_ORDERS,
    PERMISSIONS.INSERT_SALES_ORDERS,
    PERMISSIONS.UPDATE_SALES_ORDERS,
    PERMISSIONS.TOGGLE_SALES_ORDERS,
    // Order Management
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.INSERT_ORDERS,
    PERMISSIONS.UPDATE_ORDERS,
    PERMISSIONS.CANCEL_ORDERS,
    // Payment Management
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.PROCESS_REFUNDS,
    // Communication (Messages)
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.INSERT_MESSAGES,
    PERMISSIONS.UPDATE_MESSAGES,
    PERMISSIONS.DELETE_MESSAGES,
    // Event Management
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.INSERT_EVENTS,
    PERMISSIONS.UPDATE_EVENTS,
    PERMISSIONS.TOGGLE_EVENTS,
    // Support Management
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.RAISE_TICKETS,
    PERMISSIONS.EDIT_TICKETS,
    PERMISSIONS.DELETE_TICKETS,
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.POST_COMMENTS,
    PERMISSIONS.DOWNLOAD_ATTACHMENTS,
    // Reporting
    PERMISSIONS.VIEW_ORDER_STATISTICS,
    PERMISSIONS.VIEW_PAYMENT_STATISTICS,
    // System Admin
    PERMISSIONS.VIEW_LOGS,
    // Web Template Management
    PERMISSIONS.VIEW_WEB_TEMPLATE,
    PERMISSIONS.INSERT_WEB_TEMPLATE,
    PERMISSIONS.UPDATE_WEB_TEMPLATE,
    PERMISSIONS.DEACTIVATE_WEB_TEMPLATE,
    PERMISSIONS.DEPLOY_WEB_TEMPLATE,
  ],
  [USER_ROLES.MANAGER]: [
    // Manager can view and insert, but cannot update or delete anything
    // User Management
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.INSERT_USER,
    PERMISSIONS.VIEW_GROUPS,
    PERMISSIONS.INSERT_GROUPS,
    // Address Management
    PERMISSIONS.VIEW_ADDRESS,
    PERMISSIONS.INSERT_ADDRESS,
    // Client Management
    PERMISSIONS.VIEW_CLIENT,
    PERMISSIONS.INSERT_CLIENT,
    // API Management
    PERMISSIONS.VIEW_API_KEYS,
    // Lead Management
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.INSERT_LEADS,
    // Marketing (Promos)
    PERMISSIONS.VIEW_PROMOS,
    PERMISSIONS.INSERT_PROMOS,
    // Product Management
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.INSERT_PRODUCTS,
    // Package Management
    PERMISSIONS.VIEW_PACKAGES,
    PERMISSIONS.INSERT_PACKAGES,
    // Logistics (Pickup Locations)
    PERMISSIONS.VIEW_PICKUP_LOCATIONS,
    PERMISSIONS.INSERT_PICKUP_LOCATIONS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.INSERT_PURCHASE_ORDERS,
    // Sales Management
    PERMISSIONS.VIEW_SALES_ORDERS,
    PERMISSIONS.INSERT_SALES_ORDERS,
    // Order Management
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.INSERT_ORDERS,
    // Payment Management
    PERMISSIONS.VIEW_PAYMENTS,
    // Communication (Messages)
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.INSERT_MESSAGES,
    // Event Management
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.INSERT_EVENTS,
    // Support Management (all roles have full support management access)
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.RAISE_TICKETS,
    PERMISSIONS.EDIT_TICKETS,
    PERMISSIONS.DELETE_TICKETS,
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.POST_COMMENTS,
    PERMISSIONS.DOWNLOAD_ATTACHMENTS,
    // Reporting
    PERMISSIONS.VIEW_ORDER_STATISTICS,
    PERMISSIONS.VIEW_PAYMENT_STATISTICS,
    // System Admin
    PERMISSIONS.VIEW_LOGS,
    // Web Template Management
    PERMISSIONS.VIEW_WEB_TEMPLATE,
    PERMISSIONS.INSERT_WEB_TEMPLATE,
  ],
  [USER_ROLES.VIEWER]: [
    // Viewer can only view, no create/update/delete
    // User Management
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.VIEW_GROUPS,
    // Address Management
    PERMISSIONS.VIEW_ADDRESS,
    // Client Management
    PERMISSIONS.VIEW_CLIENT,
    // API Management
    PERMISSIONS.VIEW_API_KEYS,
    // Lead Management
    PERMISSIONS.VIEW_LEADS,
    // Marketing (Promos)
    PERMISSIONS.VIEW_PROMOS,
    // Product Management
    PERMISSIONS.VIEW_PRODUCTS,
    // Package Management
    PERMISSIONS.VIEW_PACKAGES,
    // Logistics (Pickup Locations)
    PERMISSIONS.VIEW_PICKUP_LOCATIONS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    // Sales Management
    PERMISSIONS.VIEW_SALES_ORDERS,
    // Order Management
    PERMISSIONS.VIEW_ORDERS,
    // Payment Management
    PERMISSIONS.VIEW_PAYMENTS,
    // Communication (Messages)
    PERMISSIONS.VIEW_MESSAGES,
    // Event Management
    PERMISSIONS.VIEW_EVENTS,
    // Support Management (all roles have full support management access)
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.RAISE_TICKETS,
    PERMISSIONS.EDIT_TICKETS,
    PERMISSIONS.DELETE_TICKETS,
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.POST_COMMENTS,
    PERMISSIONS.DOWNLOAD_ATTACHMENTS,
    // Reporting
    PERMISSIONS.VIEW_ORDER_STATISTICS,
    PERMISSIONS.VIEW_PAYMENT_STATISTICS,
    // System Admin
    PERMISSIONS.VIEW_LOGS,
    // Web Template Management
    PERMISSIONS.VIEW_WEB_TEMPLATE,
  ],
  [USER_ROLES.CUSTOMER]: [
    // Customer has limited access to their own data
    // User Management
    PERMISSIONS.VIEW_USER,
    // Address Management
    PERMISSIONS.VIEW_ADDRESS,
    PERMISSIONS.INSERT_ADDRESS,
    PERMISSIONS.UPDATE_ADDRESS,
    // Product Management
    PERMISSIONS.VIEW_PRODUCTS,
    // Package Management
    PERMISSIONS.VIEW_PACKAGES,
    // Logistics (Pickup Locations)
    PERMISSIONS.VIEW_PICKUP_LOCATIONS,
    // Order Management
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.INSERT_ORDERS,
    PERMISSIONS.UPDATE_ORDERS,
    PERMISSIONS.CANCEL_ORDERS,
    // Support Management
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.RAISE_TICKETS,
    PERMISSIONS.EDIT_TICKETS,
    PERMISSIONS.DELETE_TICKETS,
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.POST_COMMENTS,
    PERMISSIONS.DOWNLOAD_ATTACHMENTS,
    // Web Template Management
    PERMISSIONS.VIEW_WEB_TEMPLATE,
  ],
  [USER_ROLES.CUSTOM]: [
    // Custom role has no default permissions - user selects manually
  ],
}

/**
 * Indian States and Union Territories
 * Complete list of all 28 states and 8 union territories
 */
export const INDIAN_STATES = {
  // States
  ANDHRA_PRADESH: 'Andhra Pradesh',
  ARUNACHAL_PRADESH: 'Arunachal Pradesh',
  ASSAM: 'Assam',
  BIHAR: 'Bihar',
  CHHATTISGARH: 'Chhattisgarh',
  GOA: 'Goa',
  GUJARAT: 'Gujarat',
  HARYANA: 'Haryana',
  HIMACHAL_PRADESH: 'Himachal Pradesh',
  JHARKHAND: 'Jharkhand',
  KARNATAKA: 'Karnataka',
  KERALA: 'Kerala',
  MADHYA_PRADESH: 'Madhya Pradesh',
  MAHARASHTRA: 'Maharashtra',
  MANIPUR: 'Manipur',
  MEGHALAYA: 'Meghalaya',
  MIZORAM: 'Mizoram',
  NAGALAND: 'Nagaland',
  ODISHA: 'Odisha',
  PUNJAB: 'Punjab',
  RAJASTHAN: 'Rajasthan',
  SIKKIM: 'Sikkim',
  TAMIL_NADU: 'Tamil Nadu',
  TELANGANA: 'Telangana',
  TRIPURA: 'Tripura',
  UTTAR_PRADESH: 'Uttar Pradesh',
  UTTARAKHAND: 'Uttarakhand',
  WEST_BENGAL: 'West Bengal',
  // Union Territories
  ANDAMAN_AND_NICOBAR: 'Andaman and Nicobar Islands',
  CHANDIGARH: 'Chandigarh',
  DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU: 'Dadra and Nagar Haveli and Daman and Diu',
  DELHI: 'Delhi',
  JAMMU_AND_KASHMIR: 'Jammu and Kashmir',
  LADAKH: 'Ladakh',
  LAKSHADWEEP: 'Lakshadweep',
  PUDUCHERRY: 'Puducherry',
} as const

/**
 * Array of all Indian states and union territories
 * Useful for dropdowns and state selection
 */
export const INDIAN_STATES_ARRAY: string[] = [
  INDIAN_STATES.ANDHRA_PRADESH,
  INDIAN_STATES.ARUNACHAL_PRADESH,
  INDIAN_STATES.ASSAM,
  INDIAN_STATES.BIHAR,
  INDIAN_STATES.CHHATTISGARH,
  INDIAN_STATES.GOA,
  INDIAN_STATES.GUJARAT,
  INDIAN_STATES.HARYANA,
  INDIAN_STATES.HIMACHAL_PRADESH,
  INDIAN_STATES.JHARKHAND,
  INDIAN_STATES.KARNATAKA,
  INDIAN_STATES.KERALA,
  INDIAN_STATES.MADHYA_PRADESH,
  INDIAN_STATES.MAHARASHTRA,
  INDIAN_STATES.MANIPUR,
  INDIAN_STATES.MEGHALAYA,
  INDIAN_STATES.MIZORAM,
  INDIAN_STATES.NAGALAND,
  INDIAN_STATES.ODISHA,
  INDIAN_STATES.PUNJAB,
  INDIAN_STATES.RAJASTHAN,
  INDIAN_STATES.SIKKIM,
  INDIAN_STATES.TAMIL_NADU,
  INDIAN_STATES.TELANGANA,
  INDIAN_STATES.TRIPURA,
  INDIAN_STATES.UTTAR_PRADESH,
  INDIAN_STATES.UTTARAKHAND,
  INDIAN_STATES.WEST_BENGAL,
  INDIAN_STATES.ANDAMAN_AND_NICOBAR,
  INDIAN_STATES.CHANDIGARH,
  INDIAN_STATES.DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU,
  INDIAN_STATES.DELHI,
  INDIAN_STATES.JAMMU_AND_KASHMIR,
  INDIAN_STATES.LADAKH,
  INDIAN_STATES.LAKSHADWEEP,
  INDIAN_STATES.PUDUCHERRY,
]

/**
 * Log levels available in the system
 * These must match the database constraint in UserLog table
 * All levels are in UPPERCASE to match the database constraint
 */
export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
} as const

/**
 * Array of all available log levels
 * Useful for dropdowns and log level selection
 */
export const LOG_LEVELS_ARRAY: string[] = [
  LOG_LEVELS.DEBUG,
  LOG_LEVELS.INFO,
  LOG_LEVELS.WARN,
  LOG_LEVELS.ERROR,
  LOG_LEVELS.FATAL,
]

/**
 * Log level to MUI color mapping
 * Used for displaying color-coded log level chips in the UI
 */
export const LOG_LEVEL_COLORS = {
  [LOG_LEVELS.DEBUG]: 'default',
  [LOG_LEVELS.INFO]: 'info',
  [LOG_LEVELS.WARN]: 'warning',
  [LOG_LEVELS.ERROR]: 'error',
  [LOG_LEVELS.FATAL]: 'error',
} as const

/**
 * State name to abbreviation mapping for Indian states and union territories
 * Used for displaying compact state codes in the UI
 */
export const STATE_ABBREVIATIONS: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  Assam: 'AS',
  Bihar: 'BR',
  Chhattisgarh: 'CG',
  Goa: 'GA',
  Gujarat: 'GJ',
  Haryana: 'HR',
  'Himachal Pradesh': 'HP',
  Jharkhand: 'JH',
  Karnataka: 'KA',
  Kerala: 'KL',
  'Madhya Pradesh': 'MP',
  Maharashtra: 'MH',
  Manipur: 'MN',
  Meghalaya: 'ML',
  Mizoram: 'MZ',
  Nagaland: 'NL',
  Odisha: 'OD',
  Punjab: 'PB',
  Rajasthan: 'RJ',
  Sikkim: 'SK',
  'Tamil Nadu': 'TN',
  Telangana: 'TG',
  Tripura: 'TR',
  'Uttar Pradesh': 'UP',
  Uttarakhand: 'UK',
  'West Bengal': 'WB',
  'Andaman and Nicobar Islands': 'AN',
  Chandigarh: 'CH',
  'Dadra and Nagar Haveli and Daman and Diu': 'DH',
  Delhi: 'DL',
  'Jammu and Kashmir': 'JK',
  Ladakh: 'LA',
  Lakshadweep: 'LD',
  Puducherry: 'PY',
}
