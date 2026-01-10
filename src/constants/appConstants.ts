/**
 * Application-wide constants
 * This file contains constants used throughout the application
 */

/**
 * Enum for different input field types
 */
export enum FieldType {
  Text = 'text',
  Email = 'email',
  Phone = 'phone',
  Password = 'password',
  Number = 'number',
  Date = 'date',
  DateTime = 'datetime',
  Select = 'select',
  Autocomplete = 'autocomplete',
  LazyAutocomplete = 'lazy-autocomplete',
  Textarea = 'textarea',
  RichText = 'richtext',
  Image = 'image',
  Address = 'address',
  Switch = 'switch',
}

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
  // Shipment Management
  VIEW_SHIPMENTS: 'ViewShipments',
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
    // Shipment Management
    PERMISSIONS.VIEW_SHIPMENTS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.INSERT_PURCHASE_ORDERS,
    PERMISSIONS.UPDATE_PURCHASE_ORDERS,
    PERMISSIONS.TOGGLE_PURCHASE_ORDERS,
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
    // Shipment Management
    PERMISSIONS.VIEW_SHIPMENTS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.INSERT_PURCHASE_ORDERS,
    PERMISSIONS.UPDATE_PURCHASE_ORDERS,
    PERMISSIONS.TOGGLE_PURCHASE_ORDERS,
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
    // Shipment Management
    PERMISSIONS.VIEW_SHIPMENTS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.INSERT_PURCHASE_ORDERS,
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
    // Shipment Management
    PERMISSIONS.VIEW_SHIPMENTS,
    // Purchase Management
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
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

/**
 * Max records options for bulk import operations
 * Used in import pages for setting the maximum number of records to import at once
 */
export const MAX_RECORDS_OPTIONS: readonly number[] = [25, 100, 200, 500, 1000]

/**
 * Default max records value for bulk import operations
 */
export const DEFAULT_MAX_RECORDS: number = 25

/**
 * Lead status options matching database constraint
 * Used in lead forms and grids for status selection
 */
export const LEAD_STATUS_OPTIONS = [
  { value: 'Not Contacted', label: 'Not Contacted' },
  { value: 'Attempted To Contact', label: 'Attempted To Contact' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Contact In Future', label: 'Contact In Future' },
  { value: 'Re Qualified', label: 'Re Qualified' },
  { value: 'Not Qualified', label: 'Not Qualified' },
  { value: 'Lost Lead', label: 'Lost Lead' },
  { value: 'Junk Lead', label: 'Junk Lead' },
] as const

/**
 * Product condition options matching database constraint
 * Used in product forms and grids for condition selection
 */
export const PRODUCT_CONDITION_OPTIONS = [
  { value: 'NEW_WITH_TAGS', label: 'New with Tags', color: 'success' as const },
  { value: 'NEW_WITHOUT_TAGS', label: 'New without Tags', color: 'info' as const },
  { value: 'NEW_WITH_DEFECTS', label: 'New with Defects', color: 'warning' as const },
  { value: 'PRE_OWNED', label: 'Pre-Owned', color: 'secondary' as const },
  { value: 'PRE_OWNED_WITH_DEFECTS', label: 'Pre-Owned with Defects', color: 'error' as const },
] as const

/**
 * Get condition color by value
 * Returns the MUI chip color for a given condition value
 */
export const getConditionColor = (
  conditionValue: string,
): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const condition = PRODUCT_CONDITION_OPTIONS.find(opt => opt.value === conditionValue)
  return condition?.color ?? 'default'
}

/**
 * Get condition label by value
 * Returns the display label for a given condition value
 */
export const getConditionLabel = (conditionValue: string): string => {
  const condition = PRODUCT_CONDITION_OPTIONS.find(opt => opt.value === conditionValue)
  return condition?.label ?? conditionValue
}

/**
 * Package type options matching database constraint
 * CHECK (packageType IN ('STANDARD', 'FRAGILE', 'OVERSIZED', 'ENVELOPE', 'BOX', 'TUBE', 'CUSTOM'))
 * Used in package forms and grids for package type selection
 * Each type has a meaningful color for visual distinction in the UI
 */
export const PACKAGE_TYPE_OPTIONS = [
  { value: 'STANDARD', label: 'Standard', color: 'default' as const },
  { value: 'FRAGILE', label: 'Fragile', color: 'error' as const },
  { value: 'OVERSIZED', label: 'Oversized', color: 'warning' as const },
  { value: 'ENVELOPE', label: 'Envelope', color: 'info' as const },
  { value: 'BOX', label: 'Box', color: 'primary' as const },
  { value: 'TUBE', label: 'Tube', color: 'secondary' as const },
  { value: 'CUSTOM', label: 'Custom', color: 'success' as const },
] as const

export type PackageType = (typeof PACKAGE_TYPE_OPTIONS)[number]['value']

/**
 * Get package type label by value
 * Returns the display label for a given package type value
 */
export const getPackageTypeLabel = (packageTypeValue: string): string => {
  const packageType = PACKAGE_TYPE_OPTIONS.find(opt => opt.value === packageTypeValue)
  return packageType?.label ?? packageTypeValue
}

/**
 * Get package type color by value
 * Returns the MUI chip color for a given package type value
 */
export const getPackageTypeColor = (
  packageTypeValue: string,
): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const packageType = PACKAGE_TYPE_OPTIONS.find(opt => opt.value === packageTypeValue)
  return packageType?.color ?? 'default'
}

/**
 * Countries list - All countries in the world
 * Used in product forms and other places requiring country selection
 */
export const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'East Timor',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kosovo',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
] as const

/**
 * Product color options with hex codes and color names
 * Used in product forms with visual color preview
 */
export const PRODUCT_COLOR_OPTIONS = [
  { hex: '#5d8aa8', name: 'Air Force Blue (Raf)' },
  { hex: '#00308f', name: 'Air Force Blue (Usaf)' },
  { hex: '#72a0c1', name: 'Air Superiority Blue' },
  { hex: '#a32638', name: 'Alabama Crimson' },
  { hex: '#f0f8ff', name: 'Alice Blue' },
  { hex: '#e32636', name: 'Alizarin Crimson' },
  { hex: '#c46210', name: 'Alloy Orange' },
  { hex: '#efdecd', name: 'Almond' },
  { hex: '#e52b50', name: 'Amaranth' },
  { hex: '#ffbf00', name: 'Amber' },
  { hex: '#ff7e00', name: 'Amber (Sae/Ece)' },
  { hex: '#ff033e', name: 'American Rose' },
  { hex: '#96c', name: 'Amethyst' },
  { hex: '#a4c639', name: 'Android Green' },
  { hex: '#f2f3f4', name: 'Anti-Flash White' },
  { hex: '#cd9575', name: 'Antique Brass' },
  { hex: '#915c83', name: 'Antique Fuchsia' },
  { hex: '#841b2d', name: 'Antique Ruby' },
  { hex: '#faebd7', name: 'Antique White' },
  { hex: '#008000', name: 'Ao (English)' },
  { hex: '#8db600', name: 'Apple Green' },
  { hex: '#fbceb1', name: 'Apricot' },
  { hex: '#0ff', name: 'Aqua' },
  { hex: '#7fffd4', name: 'Aquamarine' },
  { hex: '#4b5320', name: 'Army Green' },
  { hex: '#3b444b', name: 'Arsenic' },
  { hex: '#e9d66b', name: 'Arylide Yellow' },
  { hex: '#b2beb5', name: 'Ash Grey' },
  { hex: '#87a96b', name: 'Asparagus' },
  { hex: '#f96', name: 'Atomic Tangerine' },
  { hex: '#a52a2a', name: 'Auburn' },
  { hex: '#fdee00', name: 'Aureolin' },
  { hex: '#6e7f80', name: 'Aurometalsaurus' },
  { hex: '#568203', name: 'Avocado' },
  { hex: '#007fff', name: 'Azure' },
  { hex: '#f0ffff', name: 'Azure Mist/Web' },
  { hex: '#89cff0', name: 'Baby Blue' },
  { hex: '#a1caf1', name: 'Baby Blue Eyes' },
  { hex: '#f4c2c2', name: 'Baby Pink' },
  { hex: '#21abcd', name: 'Ball Blue' },
  { hex: '#fae7b5', name: 'Banana Mania' },
  { hex: '#ffe135', name: 'Banana Yellow' },
  { hex: '#7c0a02', name: 'Barn Red' },
  { hex: '#848482', name: 'Battleship Grey' },
  { hex: '#98777b', name: 'Bazaar' },
  { hex: '#bcd4e6', name: 'Beau Blue' },
  { hex: '#9f8170', name: 'Beaver' },
  { hex: '#f5f5dc', name: 'Beige' },
  { hex: '#9c2542', name: "Big Dip O'Ruby" },
  { hex: '#ffe4c4', name: 'Bisque' },
  { hex: '#3d2b1f', name: 'Bistre' },
  { hex: '#fe6f5e', name: 'Bittersweet' },
  { hex: '#bf4f51', name: 'Bittersweet Shimmer' },
  { hex: '#000', name: 'Black' },
  { hex: '#3d0c02', name: 'Black Bean' },
  { hex: '#253529', name: 'Black Leather Jacket' },
  { hex: '#3b3c36', name: 'Black Olive' },
  { hex: '#ffebcd', name: 'Blanched Almond' },
  { hex: '#a57164', name: 'Blast-Off Bronze' },
  { hex: '#318ce7', name: 'Bleu De France' },
  { hex: '#ace5ee', name: 'Blizzard Blue' },
  { hex: '#faf0be', name: 'Blond' },
  { hex: '#00f', name: 'Blue' },
  { hex: '#a2a2d0', name: 'Blue Bell' },
  { hex: '#1f75fe', name: 'Blue (Crayola)' },
  { hex: '#69c', name: 'Blue Gray' },
  { hex: '#0d98ba', name: 'Blue-Green' },
  { hex: '#0093af', name: 'Blue (Munsell)' },
  { hex: '#0087bd', name: 'Blue (Ncs)' },
  { hex: '#339', name: 'Blue (Pigment)' },
  { hex: '#0247fe', name: 'Blue (Ryb)' },
  { hex: '#126180', name: 'Blue Sapphire' },
  { hex: '#8a2be2', name: 'Blue-Violet' },
  { hex: '#de5d83', name: 'Blush' },
  { hex: '#79443b', name: 'Bole' },
  { hex: '#0095b6', name: 'Bondi Blue' },
  { hex: '#e3dac9', name: 'Bone' },
  { hex: '#c00', name: 'Boston University Red' },
  { hex: '#006a4e', name: 'Bottle Green' },
  { hex: '#873260', name: 'Boysenberry' },
  { hex: '#0070ff', name: 'Brandeis Blue' },
  { hex: '#b5a642', name: 'Brass' },
  { hex: '#cb4154', name: 'Brick Red' },
  { hex: '#1dacd6', name: 'Bright Cerulean' },
  { hex: '#6f0', name: 'Bright Green' },
  { hex: '#bf94e4', name: 'Bright Lavender' },
  { hex: '#c32148', name: 'Bright Maroon' },
  { hex: '#ff007f', name: 'Bright Pink' },
  { hex: '#08e8de', name: 'Bright Turquoise' },
  { hex: '#d19fe8', name: 'Bright Ube' },
  { hex: '#f4bbff', name: 'Brilliant Lavender' },
  { hex: '#ff55a3', name: 'Brilliant Rose' },
  { hex: '#fb607f', name: 'Brink Pink' },
  { hex: '#004225', name: 'British Racing Green' },
  { hex: '#cd7f32', name: 'Bronze' },
  { hex: '#964b00', name: 'Brown (Traditional)' },
  { hex: '#ffc1cc', name: 'Bubble Gum' },
  { hex: '#e7feff', name: 'Bubbles' },
  { hex: '#f0dc82', name: 'Buff' },
  { hex: '#480607', name: 'Bulgarian Rose' },
  { hex: '#800020', name: 'Burgundy' },
  { hex: '#deb887', name: 'Burlywood' },
  { hex: '#c50', name: 'Burnt Orange' },
  { hex: '#e97451', name: 'Burnt Sienna' },
  { hex: '#8a3324', name: 'Burnt Umber' },
  { hex: '#bd33a4', name: 'Byzantine' },
  { hex: '#702963', name: 'Byzantium' },
  { hex: '#536872', name: 'Cadet' },
  { hex: '#5f9ea0', name: 'Cadet Blue' },
  { hex: '#91a3b0', name: 'Cadet Grey' },
  { hex: '#006b3c', name: 'Cadmium Green' },
  { hex: '#ed872d', name: 'Cadmium Orange' },
  { hex: '#e30022', name: 'Cadmium Red' },
  { hex: '#fff600', name: 'Cadmium Yellow' },
  { hex: '#a67b5b', name: 'Café Au Lait' },
  { hex: '#4b3621', name: 'Café Noir' },
  { hex: '#1e4d2b', name: 'Cal Poly Green' },
  { hex: '#a3c1ad', name: 'Cambridge Blue' },
  { hex: '#c19a6b', name: 'Camel' },
  { hex: '#efbbcc', name: 'Cameo Pink' },
  { hex: '#78866b', name: 'Camouflage Green' },
  { hex: '#ffef00', name: 'Canary Yellow' },
  { hex: '#ff0800', name: 'Candy Apple Red' },
  { hex: '#e4717a', name: 'Candy Pink' },
  { hex: '#00bfff', name: 'Capri' },
  { hex: '#592720', name: 'Caput Mortuum' },
  { hex: '#c41e3a', name: 'Cardinal' },
  { hex: '#0c9', name: 'Caribbean Green' },
  { hex: '#960018', name: 'Carmine' },
  { hex: '#d70040', name: 'Carmine (M&P)' },
  { hex: '#eb4c42', name: 'Carmine Pink' },
  { hex: '#ff0038', name: 'Carmine Red' },
  { hex: '#ffa6c9', name: 'Carnation Pink' },
  { hex: '#b31b1b', name: 'Carnelian' },
  { hex: '#99badd', name: 'Carolina Blue' },
  { hex: '#ed9121', name: 'Carrot Orange' },
  { hex: '#062a78', name: 'Catalina Blue' },
  { hex: '#92a1cf', name: 'Ceil' },
  { hex: '#ace1af', name: 'Celadon' },
  { hex: '#007ba7', name: 'Celadon Blue' },
  { hex: '#2f847c', name: 'Celadon Green' },
  { hex: '#b2ffff', name: 'Celeste (Colour)' },
  { hex: '#4997d0', name: 'Celestial Blue' },
  { hex: '#de3163', name: 'Cerise' },
  { hex: '#ec3b83', name: 'Cerise Pink' },
  { hex: '#2a52be', name: 'Cerulean Blue' },
  { hex: '#6d9bc3', name: 'Cerulean Frost' },
  { hex: '#007aa5', name: 'Cg Blue' },
  { hex: '#e03c31', name: 'Cg Red' },
  { hex: '#a0785a', name: 'Chamoisee' },
  { hex: '#fad6a5', name: 'Champagne' },
  { hex: '#36454f', name: 'Charcoal' },
  { hex: '#e68fac', name: 'Charm Pink' },
  { hex: '#dfff00', name: 'Chartreuse (Traditional)' },
  { hex: '#7fff00', name: 'Chartreuse (Web)' },
  { hex: '#ffb7c5', name: 'Cherry Blossom Pink' },
  { hex: '#cd5c5c', name: 'Chestnut' },
  { hex: '#de6fa1', name: 'China Pink' },
  { hex: '#a8516e', name: 'China Rose' },
  { hex: '#aa381e', name: 'Chinese Red' },
  { hex: '#7b3f00', name: 'Chocolate (Traditional)' },
  { hex: '#d2691e', name: 'Chocolate (Web)' },
  { hex: '#ffa700', name: 'Chrome Yellow' },
  { hex: '#98817b', name: 'Cinereous' },
  { hex: '#e34234', name: 'Cinnabar' },
  { hex: '#e4d00a', name: 'Citrine' },
  { hex: '#fbcce7', name: 'Classic Rose' },
  { hex: '#0047ab', name: 'Cobalt' },
  { hex: '#6f4e37', name: 'Coffee' },
  { hex: '#9bddff', name: 'Columbia Blue' },
  { hex: '#f88379', name: 'Congo Pink' },
  { hex: '#002e63', name: 'Cool Black' },
  { hex: '#8c92ac', name: 'Cool Grey' },
  { hex: '#b87333', name: 'Copper' },
  { hex: '#da8a67', name: 'Copper (Crayola)' },
  { hex: '#ad6f69', name: 'Copper Penny' },
  { hex: '#cb6d51', name: 'Copper Red' },
  { hex: '#966', name: 'Copper Rose' },
  { hex: '#ff3800', name: 'Coquelicot' },
  { hex: '#ff7f50', name: 'Coral' },
  { hex: '#ff4040', name: 'Coral Red' },
  { hex: '#893f45', name: 'Cordovan' },
  { hex: '#fbec5d', name: 'Corn' },
  { hex: '#6495ed', name: 'Cornflower Blue' },
  { hex: '#fff8dc', name: 'Cornsilk' },
  { hex: '#fff8e7', name: 'Cosmic Latte' },
  { hex: '#ffbcd9', name: 'Cotton Candy' },
  { hex: '#fffdd0', name: 'Cream' },
  { hex: '#dc143c', name: 'Crimson' },
  { hex: '#be0032', name: 'Crimson Glory' },
  { hex: '#00b7eb', name: 'Cyan (Process)' },
  { hex: '#ffff31', name: 'Daffodil' },
  { hex: '#f0e130', name: 'Dandelion' },
  { hex: '#00008b', name: 'Dark Blue' },
  { hex: '#654321', name: 'Dark Brown' },
  { hex: '#5d3954', name: 'Dark Byzantium' },
  { hex: '#a40000', name: 'Dark Candy Apple Red' },
  { hex: '#08457e', name: 'Dark Cerulean' },
  { hex: '#986960', name: 'Dark Chestnut' },
  { hex: '#cd5b45', name: 'Dark Coral' },
  { hex: '#008b8b', name: 'Dark Cyan' },
  { hex: '#536878', name: 'Dark Electric Blue' },
  { hex: '#b8860b', name: 'Dark Goldenrod' },
  { hex: '#a9a9a9', name: 'Dark Gray' },
  { hex: '#013220', name: 'Dark Green' },
  { hex: '#00416a', name: 'Dark Imperial Blue' },
  { hex: '#1a2421', name: 'Dark Jungle Green' },
  { hex: '#bdb76b', name: 'Dark Khaki' },
  { hex: '#483c32', name: 'Dark Lava' },
  { hex: '#734f96', name: 'Dark Lavender' },
  { hex: '#8b008b', name: 'Dark Magenta' },
  { hex: '#036', name: 'Dark Midnight Blue' },
  { hex: '#556b2f', name: 'Dark Olive Green' },
  { hex: '#ff8c00', name: 'Dark Orange' },
  { hex: '#9932cc', name: 'Dark Orchid' },
  { hex: '#779ecb', name: 'Dark Pastel Blue' },
  { hex: '#03c03c', name: 'Dark Pastel Green' },
  { hex: '#966fd6', name: 'Dark Pastel Purple' },
  { hex: '#c23b22', name: 'Dark Pastel Red' },
  { hex: '#e75480', name: 'Dark Pink' },
  { hex: '#039', name: 'Dark Powder Blue' },
  { hex: '#872657', name: 'Dark Raspberry' },
  { hex: '#8b0000', name: 'Dark Red' },
  { hex: '#e9967a', name: 'Dark Salmon' },
  { hex: '#560319', name: 'Dark Scarlet' },
  { hex: '#8fbc8f', name: 'Dark Sea Green' },
  { hex: '#3c1414', name: 'Dark Sienna' },
  { hex: '#483d8b', name: 'Dark Slate Blue' },
  { hex: '#2f4f4f', name: 'Dark Slate Gray' },
  { hex: '#177245', name: 'Dark Spring Green' },
  { hex: '#918151', name: 'Dark Tan' },
  { hex: '#ffa812', name: 'Dark Tangerine' },
  { hex: '#cc4e5c', name: 'Dark Terra Cotta' },
  { hex: '#00ced1', name: 'Dark Turquoise' },
  { hex: '#9400d3', name: 'Dark Violet' },
  { hex: '#9b870c', name: 'Dark Yellow' },
  { hex: '#00703c', name: 'Dartmouth Green' },
  { hex: '#555', name: "Davy'S Grey" },
  { hex: '#d70a53', name: 'Debian Red' },
  { hex: '#a9203e', name: 'Deep Carmine' },
  { hex: '#ef3038', name: 'Deep Carmine Pink' },
  { hex: '#e9692c', name: 'Deep Carrot Orange' },
  { hex: '#da3287', name: 'Deep Cerise' },
  { hex: '#b94e48', name: 'Deep Chestnut' },
  { hex: '#704241', name: 'Deep Coffee' },
  { hex: '#c154c1', name: 'Deep Fuchsia' },
  { hex: '#004b49', name: 'Deep Jungle Green' },
  { hex: '#95b', name: 'Deep Lilac' },
  { hex: '#c0c', name: 'Deep Magenta' },
  { hex: '#ffcba4', name: 'Deep Peach' },
  { hex: '#ff1493', name: 'Deep Pink' },
  { hex: '#843f5b', name: 'Deep Ruby' },
  { hex: '#f93', name: 'Deep Saffron' },
  { hex: '#66424d', name: 'Deep Tuscan Red' },
  { hex: '#1560bd', name: 'Denim' },
  { hex: '#edc9af', name: 'Desert Sand' },
  { hex: '#696969', name: 'Dim Gray' },
  { hex: '#1e90ff', name: 'Dodger Blue' },
  { hex: '#d71868', name: 'Dogwood Rose' },
  { hex: '#85bb65', name: 'Dollar Bill' },
  { hex: '#967117', name: 'Drab' },
  { hex: '#00009c', name: 'Duke Blue' },
  { hex: '#e1a95f', name: 'Earth Yellow' },
  { hex: '#555d50', name: 'Ebony' },
  { hex: '#c2b280', name: 'Ecru' },
  { hex: '#614051', name: 'Eggplant' },
  { hex: '#f0ead6', name: 'Eggshell' },
  { hex: '#1034a6', name: 'Egyptian Blue' },
  { hex: '#7df9ff', name: 'Electric Blue' },
  { hex: '#ff003f', name: 'Electric Crimson' },
  { hex: '#0f0', name: 'Electric Green' },
  { hex: '#6f00ff', name: 'Electric Indigo' },
  { hex: '#cf0', name: 'Electric Lime' },
  { hex: '#bf00ff', name: 'Electric Purple' },
  { hex: '#3f00ff', name: 'Electric Ultramarine' },
  { hex: '#8f00ff', name: 'Electric Violet' },
  { hex: '#ff0', name: 'Electric Yellow' },
  { hex: '#50c878', name: 'Emerald' },
  { hex: '#b48395', name: 'English Lavender' },
  { hex: '#96c8a2', name: 'Eton Blue' },
  { hex: '#801818', name: 'Falu Red' },
  { hex: '#b53389', name: 'Fandango' },
  { hex: '#f400a1', name: 'Fashion Fuchsia' },
  { hex: '#e5aa70', name: 'Fawn' },
  { hex: '#4d5d53', name: 'Feldgrau' },
  { hex: '#4f7942', name: 'Fern Green' },
  { hex: '#ff2800', name: 'Ferrari Red' },
  { hex: '#6c541e', name: 'Field Drab' },
  { hex: '#ce2029', name: 'Fire Engine Red' },
  { hex: '#b22222', name: 'Firebrick' },
  { hex: '#e25822', name: 'Flame' },
  { hex: '#fc8eac', name: 'Flamingo Pink' },
  { hex: '#f7e98e', name: 'Flavescent' },
  { hex: '#eedc82', name: 'Flax' },
  { hex: '#fffaf0', name: 'Floral White' },
  { hex: '#ff004f', name: 'Folly' },
  { hex: '#014421', name: 'Forest Green (Traditional)' },
  { hex: '#228b22', name: 'Forest Green (Web)' },
  { hex: '#0072bb', name: 'French Blue' },
  { hex: '#86608e', name: 'French Lilac' },
  { hex: '#c72c48', name: 'French Raspberry' },
  { hex: '#f64a8a', name: 'French Rose' },
  { hex: '#f0f', name: 'Fuchsia' },
  { hex: '#f7f', name: 'Fuchsia Pink' },
  { hex: '#c74375', name: 'Fuchsia Rose' },
  { hex: '#e48400', name: 'Fulvous' },
  { hex: '#c66', name: 'Fuzzy Wuzzy' },
  { hex: '#dcdcdc', name: 'Gainsboro' },
  { hex: '#e49b0f', name: 'Gamboge' },
  { hex: '#f8f8ff', name: 'Ghost White' },
  { hex: '#b06500', name: 'Ginger' },
  { hex: '#6082b6', name: 'Glaucous' },
  { hex: '#e6e8fa', name: 'Glitter' },
  { hex: '#d4af37', name: 'Gold (Metallic)' },
  { hex: '#ffd700', name: 'Gold (Web) (Golden)' },
  { hex: '#996515', name: 'Golden Brown' },
  { hex: '#fcc200', name: 'Golden Poppy' },
  { hex: '#ffdf00', name: 'Golden Yellow' },
  { hex: '#daa520', name: 'Goldenrod' },
  { hex: '#a8e4a0', name: 'Granny Smith Apple' },
  { hex: '#808080', name: 'Gray' },
  { hex: '#465945', name: 'Gray-Asparagus' },
  { hex: '#bebebe', name: 'Gray (X11 Gray)' },
  { hex: '#1cac78', name: 'Green (Crayola)' },
  { hex: '#00a877', name: 'Green (Munsell)' },
  { hex: '#009f6b', name: 'Green (Ncs)' },
  { hex: '#00a550', name: 'Green (Pigment)' },
  { hex: '#66b032', name: 'Green (Ryb)' },
  { hex: '#adff2f', name: 'Green-Yellow' },
  { hex: '#a99a86', name: 'Grullo' },
  { hex: '#00ff7f', name: 'Guppie Green' },
  { hex: '#663854', name: 'Halayà úBe' },
  { hex: '#446ccf', name: 'Han Blue' },
  { hex: '#5218fa', name: 'Han Purple' },
  { hex: '#3fff00', name: 'Harlequin' },
  { hex: '#c90016', name: 'Harvard Crimson' },
  { hex: '#da9100', name: 'Harvest Gold' },
  { hex: '#808000', name: 'Heart Gold' },
  { hex: '#df73ff', name: 'Heliotrope' },
  { hex: '#f0fff0', name: 'Honeydew' },
  { hex: '#007fbf', name: 'Honolulu Blue' },
  { hex: '#49796b', name: "Hooker'S Green" },
  { hex: '#ff1dce', name: 'Hot Magenta' },
  { hex: '#ff69b4', name: 'Hot Pink' },
  { hex: '#355e3b', name: 'Hunter Green' },
  { hex: '#71a6d2', name: 'Iceberg' },
  { hex: '#fcf75e', name: 'Icterine' },
  { hex: '#002395', name: 'Imperial Blue' },
  { hex: '#b2ec5d', name: 'Inchworm' },
  { hex: '#138808', name: 'India Green' },
  { hex: '#e3a857', name: 'Indian Yellow' },
  { hex: '#4b0082', name: 'Indigo (Web)' },
  { hex: '#002fa7', name: 'International Klein Blue' },
  { hex: '#ff4f00', name: 'International Orange (Aerospace)' },
  { hex: '#ba160c', name: 'International Orange (Engineering)' },
  { hex: '#c0362c', name: 'International Orange (Golden Gate Bridge)' },
  { hex: '#5a4fcf', name: 'Iris' },
  { hex: '#f4f0ec', name: 'Isabelline' },
  { hex: '#009000', name: 'Islamic Green' },
  { hex: '#fffff0', name: 'Ivory' },
  { hex: '#00a86b', name: 'Jade' },
  { hex: '#f8de7e', name: 'Jasmine' },
  { hex: '#d73b3e', name: 'Jasper' },
  { hex: '#a50b5e', name: 'Jazzberry Jam' },
  { hex: '#343434', name: 'Jet' },
  { hex: '#fada5e', name: 'Jonquil' },
  { hex: '#bdda57', name: 'June Bud' },
  { hex: '#29ab87', name: 'Jungle Green' },
  { hex: '#4cbb17', name: 'Kelly Green' },
  { hex: '#7c1c05', name: 'Kenyan Copper' },
  { hex: '#c3b091', name: 'Khaki (Html/Css) (Khaki)' },
  { hex: '#f0e68c', name: 'Khaki (X11) (Light Khaki)' },
  { hex: '#e8000d', name: 'Ku Crimson' },
  { hex: '#087830', name: 'La Salle Green' },
  { hex: '#d6cadd', name: 'Languid Lavender' },
  { hex: '#26619c', name: 'Lapis Lazuli' },
  { hex: '#fefe22', name: 'Laser Lemon' },
  { hex: '#a9ba9d', name: 'Laurel Green' },
  { hex: '#cf1020', name: 'Lava' },
  { hex: '#ccf', name: 'Lavender Blue' },
  { hex: '#fff0f5', name: 'Lavender Blush' },
  { hex: '#b57edc', name: 'Lavender (Floral)' },
  { hex: '#c4c3d0', name: 'Lavender Gray' },
  { hex: '#9457eb', name: 'Lavender Indigo' },
  { hex: '#ee82ee', name: 'Lavender Magenta' },
  { hex: '#e6e6fa', name: 'Lavender Mist' },
  { hex: '#fbaed2', name: 'Lavender Pink' },
  { hex: '#967bb6', name: 'Lavender Purple' },
  { hex: '#fba0e3', name: 'Lavender Rose' },
  { hex: '#7cfc00', name: 'Lawn Green' },
  { hex: '#fff700', name: 'Lemon' },
  { hex: '#fffacd', name: 'Lemon Chiffon' },
  { hex: '#e3ff00', name: 'Lemon Lime' },
  { hex: '#1a1110', name: 'Licorice' },
  { hex: '#fdd5b1', name: 'Light Apricot' },
  { hex: '#add8e6', name: 'Light Blue' },
  { hex: '#b5651d', name: 'Light Brown' },
  { hex: '#e66771', name: 'Light Carmine Pink' },
  { hex: '#f08080', name: 'Light Coral' },
  { hex: '#93ccea', name: 'Light Cornflower Blue' },
  { hex: '#f56991', name: 'Light Crimson' },
  { hex: '#e0ffff', name: 'Light Cyan' },
  { hex: '#f984ef', name: 'Light Fuchsia Pink' },
  { hex: '#fafad2', name: 'Light Goldenrod Yellow' },
  { hex: '#d3d3d3', name: 'Light Gray' },
  { hex: '#90ee90', name: 'Light Green' },
  { hex: '#b19cd9', name: 'Light Pastel Purple' },
  { hex: '#ffb6c1', name: 'Light Pink' },
  { hex: '#ffa07a', name: 'Light Salmon' },
  { hex: '#f99', name: 'Light Salmon Pink' },
  { hex: '#20b2aa', name: 'Light Sea Green' },
  { hex: '#87cefa', name: 'Light Sky Blue' },
  { hex: '#789', name: 'Light Slate Gray' },
  { hex: '#b38b6d', name: 'Light Taupe' },
  { hex: '#ffffe0', name: 'Light Yellow' },
  { hex: '#c8a2c8', name: 'Lilac' },
  { hex: '#bfff00', name: 'Lime (Color Wheel)' },
  { hex: '#32cd32', name: 'Lime Green' },
  { hex: '#9dc209', name: 'Limerick' },
  { hex: '#195905', name: 'Lincoln Green' },
  { hex: '#faf0e6', name: 'Linen' },
  { hex: '#6ca0dc', name: 'Little Boy Blue' },
  { hex: '#534b4f', name: 'Liver' },
  { hex: '#e62020', name: 'Lust' },
  { hex: '#ca1f7b', name: 'Magenta (Dye)' },
  { hex: '#ff0090', name: 'Magenta (Process)' },
  { hex: '#aaf0d1', name: 'Magic Mint' },
  { hex: '#f8f4ff', name: 'Magnolia' },
  { hex: '#c04000', name: 'Mahogany' },
  { hex: '#6050dc', name: 'Majorelle Blue' },
  { hex: '#0bda51', name: 'Malachite' },
  { hex: '#979aaa', name: 'Manatee' },
  { hex: '#ff8243', name: 'Mango Tango' },
  { hex: '#74c365', name: 'Mantis' },
  { hex: '#880085', name: 'Mardi Gras' },
  { hex: '#800000', name: 'Maroon (Html/Css)' },
  { hex: '#b03060', name: 'Maroon (X11)' },
  { hex: '#e0b0ff', name: 'Mauve' },
  { hex: '#915f6d', name: 'Mauve Taupe' },
  { hex: '#ef98aa', name: 'Mauvelous' },
  { hex: '#73c2fb', name: 'Maya Blue' },
  { hex: '#e5b73b', name: 'Meat Brown' },
  { hex: '#6da', name: 'Medium Aquamarine' },
  { hex: '#0000cd', name: 'Medium Blue' },
  { hex: '#e2062c', name: 'Medium Candy Apple Red' },
  { hex: '#af4035', name: 'Medium Carmine' },
  { hex: '#f3e5ab', name: 'Medium Champagne' },
  { hex: '#035096', name: 'Medium Electric Blue' },
  { hex: '#1c352d', name: 'Medium Jungle Green' },
  { hex: '#dda0dd', name: 'Medium Lavender Magenta' },
  { hex: '#ba55d3', name: 'Medium Orchid' },
  { hex: '#0067a5', name: 'Medium Persian Blue' },
  { hex: '#9370db', name: 'Medium Purple' },
  { hex: '#bb3385', name: 'Medium Red-Violet' },
  { hex: '#aa4069', name: 'Medium Ruby' },
  { hex: '#3cb371', name: 'Medium Sea Green' },
  { hex: '#7b68ee', name: 'Medium Slate Blue' },
  { hex: '#c9dc87', name: 'Medium Spring Bud' },
  { hex: '#00fa9a', name: 'Medium Spring Green' },
  { hex: '#674c47', name: 'Medium Taupe' },
  { hex: '#48d1cc', name: 'Medium Turquoise' },
  { hex: '#d9603b', name: 'Medium Vermilion' },
  { hex: '#c71585', name: 'Medium Violet-Red' },
  { hex: '#f8b878', name: 'Mellow Apricot' },
  { hex: '#fdbcb4', name: 'Melon' },
  { hex: '#191970', name: 'Midnight Blue' },
  { hex: '#004953', name: 'Midnight Green (Eagle Green)' },
  { hex: '#ffc40c', name: 'Mikado Yellow' },
  { hex: '#3eb489', name: 'Mint' },
  { hex: '#f5fffa', name: 'Mint Cream' },
  { hex: '#98ff98', name: 'Mint Green' },
  { hex: '#ffe4e1', name: 'Misty Rose' },
  { hex: '#73a9c2', name: 'Moonstone Blue' },
  { hex: '#ae0c00', name: 'Mordant Red 19' },
  { hex: '#addfad', name: 'Moss Green' },
  { hex: '#30ba8f', name: 'Mountain Meadow' },
  { hex: '#997a8d', name: 'Mountbatten Pink' },
  { hex: '#18453b', name: 'Msu Green' },
  { hex: '#c54b8c', name: 'Mulberry' },
  { hex: '#ffdb58', name: 'Mustard' },
  { hex: '#21421e', name: 'Myrtle' },
  { hex: '#f6adc6', name: 'Nadeshiko Pink' },
  { hex: '#2a8000', name: 'Napier Green' },
  { hex: '#ffdead', name: 'Navajo White' },
  { hex: '#000080', name: 'Navy Blue' },
  { hex: '#ffa343', name: 'Neon Carrot' },
  { hex: '#fe4164', name: 'Neon Fuchsia' },
  { hex: '#39ff14', name: 'Neon Green' },
  { hex: '#d7837f', name: 'New York Pink' },
  { hex: '#a4dded', name: 'Non-Photo Blue' },
  { hex: '#059033', name: 'North Texas Green' },
  { hex: '#0077be', name: 'Ocean Boat Blue' },
  { hex: '#c72', name: 'Ochre' },
  { hex: '#cfb53b', name: 'Old Gold' },
  { hex: '#fdf5e6', name: 'Old Lace' },
  { hex: '#796878', name: 'Old Lavender' },
  { hex: '#673147', name: 'Old Mauve' },
  { hex: '#c08081', name: 'Old Rose' },
  { hex: '#3c341f', name: 'Olive Drab #7' },
  { hex: '#6b8e23', name: 'Olive Drab (Web) (Olive Drab #3)' },
  { hex: '#9ab973', name: 'Olivine' },
  { hex: '#353839', name: 'Onyx' },
  { hex: '#b784a7', name: 'Opera Mauve' },
  { hex: '#ff7f00', name: 'Orange (Color Wheel)' },
  { hex: '#ff9f00', name: 'Orange Peel' },
  { hex: '#ff4500', name: 'Orange-Red' },
  { hex: '#fb9902', name: 'Orange (Ryb)' },
  { hex: '#ffa500', name: 'Orange (Web Color)' },
  { hex: '#da70d6', name: 'Orchid' },
  { hex: '#900', name: 'Ou Crimson Red' },
  { hex: '#414a4c', name: 'Outer Space' },
  { hex: '#ff6e4a', name: 'Outrageous Orange' },
  { hex: '#002147', name: 'Oxford Blue' },
  { hex: '#060', name: 'Pakistan Green' },
  { hex: '#273be2', name: 'Palatinate Blue' },
  { hex: '#682860', name: 'Palatinate Purple' },
  { hex: '#afeeee', name: 'Pale Blue' },
  { hex: '#987654', name: 'Pale Brown' },
  { hex: '#9bc4e2', name: 'Pale Cerulean' },
  { hex: '#ddadaf', name: 'Pale Chestnut' },
  { hex: '#abcdef', name: 'Pale Cornflower Blue' },
  { hex: '#e6be8a', name: 'Pale Gold' },
  { hex: '#eee8aa', name: 'Pale Goldenrod' },
  { hex: '#98fb98', name: 'Pale Green' },
  { hex: '#dcd0ff', name: 'Pale Lavender' },
  { hex: '#f984e5', name: 'Pale Magenta' },
  { hex: '#fadadd', name: 'Pale Pink' },
  { hex: '#db7093', name: 'Pale Red-Violet' },
  { hex: '#96ded1', name: 'Pale Robin Egg Blue' },
  { hex: '#c9c0bb', name: 'Pale Silver' },
  { hex: '#ecebbd', name: 'Pale Spring Bud' },
  { hex: '#bc987e', name: 'Pale Taupe' },
  { hex: '#78184a', name: 'Pansy Purple' },
  { hex: '#ffefd5', name: 'Papaya Whip' },
  { hex: '#aec6cf', name: 'Pastel Blue' },
  { hex: '#836953', name: 'Pastel Brown' },
  { hex: '#cfcfc4', name: 'Pastel Gray' },
  { hex: '#7d7', name: 'Pastel Green' },
  { hex: '#f49ac2', name: 'Pastel Magenta' },
  { hex: '#ffb347', name: 'Pastel Orange' },
  { hex: '#dea5a4', name: 'Pastel Pink' },
  { hex: '#b39eb5', name: 'Pastel Purple' },
  { hex: '#ff6961', name: 'Pastel Red' },
  { hex: '#cb99c9', name: 'Pastel Violet' },
  { hex: '#fdfd96', name: 'Pastel Yellow' },
  { hex: '#800080', name: 'Patriarch' },
  { hex: '#ffe5b4', name: 'Peach' },
  { hex: '#fc9', name: 'Peach-Orange' },
  { hex: '#ffdab9', name: 'Peach Puff' },
  { hex: '#fadfad', name: 'Peach-Yellow' },
  { hex: '#d1e231', name: 'Pear' },
  { hex: '#eae0c8', name: 'Pearl' },
  { hex: '#88d8c0', name: 'Pearl Aqua' },
  { hex: '#b768a2', name: 'Pearly Purple' },
  { hex: '#e6e200', name: 'Peridot' },
  { hex: '#1c39bb', name: 'Persian Blue' },
  { hex: '#00a693', name: 'Persian Green' },
  { hex: '#32127a', name: 'Persian Indigo' },
  { hex: '#d99058', name: 'Persian Orange' },
  { hex: '#f77fbe', name: 'Persian Pink' },
  { hex: '#701c1c', name: 'Persian Plum' },
  { hex: '#c33', name: 'Persian Red' },
  { hex: '#fe28a2', name: 'Persian Rose' },
  { hex: '#ec5800', name: 'Persimmon' },
  { hex: '#cd853f', name: 'Peru' },
  { hex: '#df00ff', name: 'Phlox' },
  { hex: '#000f89', name: 'Phthalo Blue' },
  { hex: '#123524', name: 'Phthalo Green' },
  { hex: '#fddde6', name: 'Piggy Pink' },
  { hex: '#01796f', name: 'Pine Green' },
  { hex: '#ffc0cb', name: 'Pink' },
  { hex: '#ffddf4', name: 'Pink Lace' },
  { hex: '#e7accf', name: 'Pink Pearl' },
  { hex: '#f78fa7', name: 'Pink Sherbet' },
  { hex: '#93c572', name: 'Pistachio' },
  { hex: '#e5e4e2', name: 'Platinum' },
  { hex: '#8e4585', name: 'Plum (Traditional)' },
  { hex: '#ff5a36', name: 'Portland Orange' },
  { hex: '#b0e0e6', name: 'Powder Blue (Web)' },
  { hex: '#ff8f00', name: 'Princeton Orange' },
  { hex: '#003153', name: 'Prussian Blue' },
  { hex: '#c89', name: 'Puce' },
  { hex: '#ff7518', name: 'Pumpkin' },
  { hex: '#69359c', name: 'Purple Heart' },
  { hex: '#9678b6', name: 'Purple Mountain Majesty' },
  { hex: '#9f00c5', name: 'Purple (Munsell)' },
  { hex: '#fe4eda', name: 'Purple Pizzazz' },
  { hex: '#50404d', name: 'Purple Taupe' },
  { hex: '#a020f0', name: 'Purple (X11)' },
  { hex: '#51484f', name: 'Quartz' },
  { hex: '#ff355e', name: 'Radical Red' },
  { hex: '#fbab60', name: 'Rajah' },
  { hex: '#e30b5d', name: 'Raspberry' },
  { hex: '#e25098', name: 'Raspberry Pink' },
  { hex: '#b3446c', name: 'Raspberry Rose' },
  { hex: '#826644', name: 'Raw Umber' },
  { hex: '#f3c', name: 'Razzle Dazzle Rose' },
  { hex: '#e3256b', name: 'Razzmatazz' },
  { hex: '#f00', name: 'Red' },
  { hex: '#860111', name: 'Red Devil' },
  { hex: '#f2003c', name: 'Red (Munsell)' },
  { hex: '#c40233', name: 'Red (Ncs)' },
  { hex: '#ff5349', name: 'Red-Orange' },
  { hex: '#ed1c24', name: 'Red (Pigment)' },
  { hex: '#fe2712', name: 'Red (Ryb)' },
  { hex: '#ab4e52', name: 'Redwood' },
  { hex: '#522d80', name: 'Regalia' },
  { hex: '#002387', name: 'Resolution Blue' },
  { hex: '#004040', name: 'Rich Black' },
  { hex: '#f1a7fe', name: 'Rich Brilliant Lavender' },
  { hex: '#0892d0', name: 'Rich Electric Blue' },
  { hex: '#a76bcf', name: 'Rich Lavender' },
  { hex: '#b666d2', name: 'Rich Lilac' },
  { hex: '#414833', name: 'Rifle Green' },
  { hex: '#0cc', name: 'Robin Egg Blue' },
  { hex: '#f9429e', name: 'Rose Bonbon' },
  { hex: '#674846', name: 'Rose Ebony' },
  { hex: '#b76e79', name: 'Rose Gold' },
  { hex: '#f6c', name: 'Rose Pink' },
  { hex: '#aa98a9', name: 'Rose Quartz' },
  { hex: '#905d5d', name: 'Rose Taupe' },
  { hex: '#65000b', name: 'Rosewood' },
  { hex: '#d40000', name: 'Rosso Corsa' },
  { hex: '#bc8f8f', name: 'Rosy Brown' },
  { hex: '#0038a8', name: 'Royal Azure' },
  { hex: '#002366', name: 'Royal Blue (Traditional)' },
  { hex: '#4169e1', name: 'Royal Blue (Web)' },
  { hex: '#ca2c92', name: 'Royal Fuchsia' },
  { hex: '#7851a9', name: 'Royal Purple' },
  { hex: '#d10056', name: 'Rubine Red' },
  { hex: '#e0115f', name: 'Ruby' },
  { hex: '#9b111e', name: 'Ruby Red' },
  { hex: '#ff0028', name: 'Ruddy' },
  { hex: '#bb6528', name: 'Ruddy Brown' },
  { hex: '#e18e96', name: 'Ruddy Pink' },
  { hex: '#a81c07', name: 'Rufous' },
  { hex: '#80461b', name: 'Russet' },
  { hex: '#b7410e', name: 'Rust' },
  { hex: '#da2c43', name: 'Rusty Red' },
  { hex: '#00563f', name: 'Sacramento State Green' },
  { hex: '#8b4513', name: 'Saddle Brown' },
  { hex: '#ff6700', name: 'Safety Orange (Blaze Orange)' },
  { hex: '#f4c430', name: 'Saffron' },
  { hex: '#ff8c69', name: 'Salmon' },
  { hex: '#ff91a4', name: 'Salmon Pink' },
  { hex: '#ecd540', name: 'Sandstorm' },
  { hex: '#f4a460', name: 'Sandy Brown' },
  { hex: '#92000a', name: 'Sangria' },
  { hex: '#507d2a', name: 'Sap Green' },
  { hex: '#0f52ba', name: 'Sapphire' },
  { hex: '#cba135', name: 'Satin Sheen Gold' },
  { hex: '#ff2400', name: 'Scarlet' },
  { hex: '#fd0e35', name: 'Scarlet (Crayola)' },
  { hex: '#ffd800', name: 'School Bus Yellow' },
  { hex: '#76ff7a', name: "Screamin' Green" },
  { hex: '#006994', name: 'Sea Blue' },
  { hex: '#2e8b57', name: 'Sea Green' },
  { hex: '#321414', name: 'Seal Brown' },
  { hex: '#fff5ee', name: 'Seashell' },
  { hex: '#ffba00', name: 'Selective Yellow' },
  { hex: '#704214', name: 'Sepia' },
  { hex: '#8a795d', name: 'Shadow' },
  { hex: '#009e60', name: 'Shamrock Green' },
  { hex: '#fc0fc0', name: 'Shocking Pink' },
  { hex: '#ff6fff', name: 'Shocking Pink (Crayola)' },
  { hex: '#882d17', name: 'Sienna' },
  { hex: '#c0c0c0', name: 'Silver' },
  { hex: '#cb410b', name: 'Sinopia' },
  { hex: '#007474', name: 'Skobeloff' },
  { hex: '#87ceeb', name: 'Sky Blue' },
  { hex: '#cf71af', name: 'Sky Magenta' },
  { hex: '#6a5acd', name: 'Slate Blue' },
  { hex: '#708090', name: 'Slate Gray' },
  { hex: '#933d41', name: 'Smokey Topaz' },
  { hex: '#100c08', name: 'Smoky Black' },
  { hex: '#fffafa', name: 'Snow' },
  { hex: '#0fc0fc', name: 'Spiro Disco Ball' },
  { hex: '#a7fc00', name: 'Spring Bud' },
  { hex: '#23297a', name: "St. Patrick'S Blue" },
  { hex: '#4682b4', name: 'Steel Blue' },
  { hex: '#4f666a', name: 'Stormcloud' },
  { hex: '#e4d96f', name: 'Straw' },
  { hex: '#fc3', name: 'Sunglow' },
  { hex: '#d2b48c', name: 'Tan' },
  { hex: '#f94d00', name: 'Tangelo' },
  { hex: '#f28500', name: 'Tangerine' },
  { hex: '#fc0', name: 'Tangerine Yellow' },
  { hex: '#8b8589', name: 'Taupe Gray' },
  { hex: '#d0f0c0', name: 'Tea Green' },
  { hex: '#008080', name: 'Teal' },
  { hex: '#367588', name: 'Teal Blue' },
  { hex: '#00827f', name: 'Teal Green' },
  { hex: '#cf3476', name: 'Telemagenta' },
  { hex: '#cd5700', name: 'Tenné (Tawny)' },
  { hex: '#e2725b', name: 'Terra Cotta' },
  { hex: '#d8bfd8', name: 'Thistle' },
  { hex: '#fc89ac', name: 'Tickle Me Pink' },
  { hex: '#0abab5', name: 'Tiffany Blue' },
  { hex: '#e08d3c', name: "Tiger'S Eye" },
  { hex: '#dbd7d2', name: 'Timberwolf' },
  { hex: '#eee600', name: 'Titanium Yellow' },
  { hex: '#ff6347', name: 'Tomato' },
  { hex: '#746cc0', name: 'Toolbox' },
  { hex: '#ffc87c', name: 'Topaz' },
  { hex: '#00755e', name: 'Tropical Rain Forest' },
  { hex: '#0073cf', name: 'True Blue' },
  { hex: '#417dc1', name: 'Tufts Blue' },
  { hex: '#deaa88', name: 'Tumbleweed' },
  { hex: '#b57281', name: 'Turkish Rose' },
  { hex: '#30d5c8', name: 'Turquoise' },
  { hex: '#00ffef', name: 'Turquoise Blue' },
  { hex: '#a0d6b4', name: 'Turquoise Green' },
  { hex: '#7c4848', name: 'Tuscan Red' },
  { hex: '#8a496b', name: 'Twilight Lavender' },
  { hex: '#66023c', name: 'Tyrian Purple' },
  { hex: '#03a', name: 'Ua Blue' },
  { hex: '#d9004c', name: 'Ua Red' },
  { hex: '#8878c3', name: 'Ube' },
  { hex: '#536895', name: 'Ucla Blue' },
  { hex: '#ffb300', name: 'Ucla Gold' },
  { hex: '#3cd070', name: 'Ufo Green' },
  { hex: '#120a8f', name: 'Ultramarine' },
  { hex: '#4166f5', name: 'Ultramarine Blue' },
  { hex: '#635147', name: 'Umber' },
  { hex: '#ffddca', name: 'Unbleached Silk' },
  { hex: '#5b92e5', name: 'United Nations Blue' },
  { hex: '#b78727', name: 'University Of California Gold' },
  { hex: '#ff6', name: 'Unmellow Yellow' },
  { hex: '#7b1113', name: 'Up Maroon' },
  { hex: '#ae2029', name: 'Upsdell Red' },
  { hex: '#e1ad21', name: 'Urobilin' },
  { hex: '#004f98', name: 'Usafa Blue' },
  { hex: '#d3003f', name: 'Utah Crimson' },
  { hex: '#c5b358', name: 'Vegas Gold' },
  { hex: '#c80815', name: 'Venetian Red' },
  { hex: '#43b3ae', name: 'Verdigris' },
  { hex: '#324ab2', name: 'Violet-Blue' },
  { hex: '#7f00ff', name: 'Violet (Color Wheel)' },
  { hex: '#8601af', name: 'Violet (Ryb)' },
  { hex: '#40826d', name: 'Viridian' },
  { hex: '#922724', name: 'Vivid Auburn' },
  { hex: '#9f1d35', name: 'Vivid Burgundy' },
  { hex: '#da1d81', name: 'Vivid Cerise' },
  { hex: '#ffa089', name: 'Vivid Tangerine' },
  { hex: '#9f00ff', name: 'Vivid Violet' },
  { hex: '#004242', name: 'Warm Black' },
  { hex: '#a4f4f9', name: 'Waterspout' },
  { hex: '#645452', name: 'Wenge' },
  { hex: '#f5deb3', name: 'Wheat' },
  { hex: '#fff', name: 'White' },
  { hex: '#f5f5f5', name: 'White Smoke' },
  { hex: '#a2add0', name: 'Wild Blue Yonder' },
  { hex: '#ff43a4', name: 'Wild Strawberry' },
  { hex: '#fc6c85', name: 'Wild Watermelon' },
  { hex: '#722f37', name: 'Wine' },
  { hex: '#c9a0dc', name: 'Wisteria' },
  { hex: '#738678', name: 'Xanadu' },
  { hex: '#0f4d92', name: 'Yale Blue' },
  { hex: '#9acd32', name: 'Yellow-Green' },
  { hex: '#efcc00', name: 'Yellow (Munsell)' },
  { hex: '#ffd300', name: 'Yellow (Ncs)' },
  { hex: '#ffae42', name: 'Yellow Orange' },
  { hex: '#fefe33', name: 'Yellow (Ryb)' },
  { hex: '#0014a8', name: 'Zaffre' },
  { hex: '#2c1608', name: 'Zinnwaldite Brown' },
] as const

/**
 * Timezone options for datetime pickers
 * Includes common timezones with user-friendly labels
 */
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
  { value: 'America/New_York', label: 'EST (Eastern Standard Time)' },
  { value: 'America/Chicago', label: 'CST (Central Standard Time)' },
  { value: 'America/Denver', label: 'MST (Mountain Standard Time)' },
  { value: 'America/Los_Angeles', label: 'PST (Pacific Standard Time)' },
  { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
  { value: 'Europe/Paris', label: 'CET (Central European Time)' },
  { value: 'Europe/Berlin', label: 'CET (Central European Time - Berlin)' },
  { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
  { value: 'Asia/Shanghai', label: 'CST (China Standard Time)' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore Time)' },
  { value: 'Asia/Dubai', label: 'GST (Gulf Standard Time)' },
  { value: 'Australia/Sydney', label: 'AEST (Australian Eastern Standard Time)' },
  { value: 'Pacific/Auckland', label: 'NZST (New Zealand Standard Time)' },
] as const

// ============================================================================
// PURCHASE ORDER CONSTANTS
// ============================================================================

/**
 * Purchase Order Status options
 * Used in purchase order forms and grids for status selection
 * Colors are chosen to reflect the workflow state:
 * - Draft/Pending: neutral/info
 * - Active/In-progress: primary/secondary
 * - Success states: success
 * - Warning/Hold: warning
 * - Error/Cancelled: error
 */
export const PURCHASE_ORDER_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'default' as const },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'info' as const },
  { value: 'APPROVED', label: 'Approved', color: 'primary' as const },
  { value: 'APPROVED_WITH_PARTIAL_PAYMENT', label: 'Approved with Partial Payment', color: 'warning' as const },
  { value: 'REJECTED', label: 'Rejected', color: 'error' as const },
  { value: 'SENT_TO_VENDOR', label: 'Sent to Vendor', color: 'secondary' as const },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged', color: 'info' as const },
  { value: 'IN_PRODUCTION', label: 'In Production', color: 'primary' as const },
  { value: 'SHIPPED', label: 'Shipped', color: 'secondary' as const },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received', color: 'warning' as const },
  { value: 'RECEIVED', label: 'Received', color: 'success' as const },
  { value: 'COMPLETED', label: 'Completed', color: 'success' as const },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' as const },
  { value: 'ON_HOLD', label: 'On Hold', color: 'warning' as const },
] as const

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUS_OPTIONS)[number]['value']

/**
 * Get purchase order status label by value
 * Returns the display label for a given status value
 */
export const getPurchaseOrderStatusLabel = (statusValue: string): string => {
  const status = PURCHASE_ORDER_STATUS_OPTIONS.find(opt => opt.value === statusValue)
  return status?.label ?? statusValue
}

/**
 * Get purchase order status color by value
 * Returns the MUI chip color for a given status value
 */
export const getPurchaseOrderStatusColor = (
  statusValue: string,
): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const status = PURCHASE_ORDER_STATUS_OPTIONS.find(opt => opt.value === statusValue)
  return status?.color ?? 'default'
}

/**
 * Priority options for purchase orders
 * Used in purchase order forms and grids for priority selection
 * Colors reflect urgency level:
 * - Low: default (grey)
 * - Medium: info (blue)
 * - High: warning (orange)
 * - Urgent: error (red)
 */
export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'default' as const },
  { value: 'MEDIUM', label: 'Medium', color: 'info' as const },
  { value: 'HIGH', label: 'High', color: 'warning' as const },
  { value: 'URGENT', label: 'Urgent', color: 'error' as const },
] as const

export type Priority = (typeof PRIORITY_OPTIONS)[number]['value']

/**
 * Get priority label by value
 * Returns the display label for a given priority value
 */
export const getPriorityLabel = (priorityValue: string): string => {
  const priority = PRIORITY_OPTIONS.find(opt => opt.value === priorityValue)
  return priority?.label ?? priorityValue
}

/**
 * Get priority color by value
 * Returns the MUI chip color for a given priority value
 */
export const getPriorityColor = (
  priorityValue: string,
): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const priority = PRIORITY_OPTIONS.find(opt => opt.value === priorityValue)
  return priority?.color ?? 'default'
}
