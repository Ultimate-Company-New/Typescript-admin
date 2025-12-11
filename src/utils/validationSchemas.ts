import { z } from 'zod'

/**
 * Industry-standard validation schemas using Zod
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email is too long')

// Password validation - industry standard requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)')

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'), // Less strict for login
})

// Registration form validation schema
export const registrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Password reset form validation schema
export const passwordResetSchema = z.object({
  email: emailSchema,
})

// Phone validation - matches database constraint: ^[+]?[0-9]{10,15}$
// Examples: 5551234567, +15551234567, 9876543210
export const phoneSchema = z
  .string()
  .min(1, 'Phone is required')
  .regex(/^\+?[0-9]{10,15}$/, 'Phone must be 10-15 digits, optionally starting with +')

// User form validation schema - matches UserRequestModel from backend
export const userFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  loginName: emailSchema, // loginName is the username field (email format)
  phone: phoneSchema,
  dob: z.coerce.date({
    errorMap: () => ({ message: 'Date of birth is required' }),
  }),
  role: z.string().min(1, 'Role is required'),
  profilePictureBase64: z.string().optional(),
  address: z.object({
    streetAddress: z.string().min(1, 'Street address is required').trim(),
    streetAddress2: z.string().optional().or(z.literal('')),
    streetAddress3: z.string().optional().or(z.literal('')),
    city: z.string().min(1, 'City is required').trim(),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required').trim(),
    country: z.string().min(1, 'Country is required'),
    addressType: z.string().min(1, 'Address type is required'),
    nameOnAddress: z.string().optional().or(z.literal('')),
    emailOnAddress: z.string().email('Invalid email address').optional().or(z.literal('')),
    phoneOnAddress: z.string().optional().or(z.literal('')),
  }),
  notes: z.string().optional().or(z.literal('')),
})

// Client settings validation schema
export const clientSettingsSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Name is too long'),
  description: z.string().min(1, 'Description is required'),
  supportEmail: emailSchema,
  website: z
    .string()
    .min(1, 'Website is required')
    .regex(/^https?:\/\/.*/, 'Website must start with http:// or https://'),
  sendGridApiKey: z.string().optional(),
  sendGridEmailAddress: z.union([emailSchema, z.literal('')]).optional(),
  sendgridSenderName: z.string().optional(),
  razorpayApiKey: z.string().optional(),
  razorpayApiSecret: z.string().optional(),
  imgbbApiKey: z.string().optional(),
  logoBase64: z.string().optional(),
  shipRocketEmail: z.union([emailSchema, z.literal('')]).optional(),
  shipRocketPassword: z.string().optional(),
  jiraUserName: z.string().optional(),
  jiraPassword: z.string().optional(),
  jiraProjectUrl: z.string().optional(),
  jiraProjectKey: z.string().optional(),
  issueTypes: z.string().optional(),
  googleCredId: z.number().optional(),
  notes: z.string().optional(),
})

// Bulk User Import validation schema - simplified version for imports
export const bulkUserImportSchema = z.object({
  loginName: emailSchema, // loginName is the username field (email format)
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phone: phoneSchema,
  role: z.string().min(1, 'Role is required'),
  dob: z.string().min(1, 'Date of birth is required'), // String format for imports (YYYY-MM-DD)
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  streetAddress: z.string().min(1, 'Street address is required').trim(),
  streetAddress2: z.string().optional().or(z.literal('')),
  streetAddress3: z.string().optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Postal code is required').trim(),
  country: z.string().min(1, 'Country is required'),
  addressType: z.string().min(1, 'Address type is required'),
  nameOnAddress: z.string().optional().or(z.literal('')),
  emailOnAddress: emailSchema.optional().or(z.literal('')),
  phoneOnAddress: phoneSchema.optional().or(z.literal('')),
  permissionIds: z.string().optional().or(z.literal('')), // Semicolon-separated IDs
  selectedGroupIds: z.string().optional().or(z.literal('')), // Semicolon-separated IDs
  notes: z.string().optional().or(z.literal('')),
})

// Bulk User Group Import validation schema - matches AddEditUserGroup form
export const bulkUserGroupImportSchema = z.object({
  name: z.string().min(1, 'Group name is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  notes: z.string().optional().or(z.literal('')),
  userIds: z.string().min(1, 'At least one user ID is required'),
})

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>
export type RegistrationFormData = z.infer<typeof registrationSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>
export type UserFormData = z.infer<typeof userFormSchema>
export type ClientSettingsFormData = z.infer<typeof clientSettingsSchema>
export type BulkUserImportData = z.infer<typeof bulkUserImportSchema>

// Manually defined type for bulk user group import (explicit for better type inference)
export interface BulkUserGroupImportData {
  name: string
  description: string
  notes?: string | ''
  userIds: string
}

// User Group form validation schema - matches AddEditUserGroup form
export const userGroupFormSchema = z.object({
  name: z.string().min(1, 'Group name is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  notes: z.string().optional().or(z.literal('')),
})

export type UserGroupFormData = z.infer<typeof userGroupFormSchema>

// Lead form validation schema - matches Lead entity from backend
export const leadFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: emailSchema,
  phone: phoneSchema,
  leadStatus: z.string().min(1, 'Lead status is required'),
  company: z.string().optional().or(z.literal('')),
  companySize: z.coerce.number().positive('Company size must be positive').optional().or(z.literal('')),
  annualRevenue: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  fax: z.string().optional().or(z.literal('')),
  assignedAgentId: z.coerce.number().min(1, 'Assigned agent is required'),
  address: z.object({
    streetAddress: z.string().min(1, 'Street address is required').trim(),
    streetAddress2: z.string().optional().or(z.literal('')),
    streetAddress3: z.string().optional().or(z.literal('')),
    city: z.string().min(1, 'City is required').trim(),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required').trim(),
    country: z.string().min(1, 'Country is required'),
    addressType: z.string().min(1, 'Address type is required'),
  }),
  notes: z.string().optional().or(z.literal('')),
})

export type LeadFormData = z.infer<typeof leadFormSchema>

// Bulk Lead Import validation schema - matches ImportLeadData structure
export const bulkLeadImportSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  leadStatus: z.string().min(1, 'Lead status is required'),
  company: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  companySize: z.string().optional().or(z.literal('')),
  annualRevenue: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  fax: z.string().optional().or(z.literal('')),
  assignedAgentId: z.string().min(1, 'Assigned agent ID is required'),
  streetAddress: z.string().min(1, 'Street address is required').trim(),
  streetAddress2: z.string().optional().or(z.literal('')),
  streetAddress3: z.string().optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required').trim(),
  country: z.string().min(1, 'Country is required'),
  addressType: z.string().min(1, 'Address type is required'),
  notes: z.string().optional().or(z.literal('')),
})

// Manually defined type for better type inference
export interface BulkLeadImportData {
  firstName: string
  lastName: string
  email: string
  phone: string
  leadStatus: string
  company?: string | ''
  title?: string | ''
  companySize?: string | ''
  annualRevenue?: string | ''
  website?: string | ''
  fax?: string | ''
  assignedAgentId: string
  streetAddress: string
  streetAddress2?: string | ''
  streetAddress3?: string | ''
  city: string
  state: string
  postalCode: string
  country: string
  addressType: string
  notes?: string | ''
}

// ============================================================================
// Promo Form Validation Schemas
// ============================================================================

// Promo form validation schema - matches PromoRequestModel from backend
export const promoFormSchema = z
  .object({
    promoCode: z
      .string()
      .min(1, 'Promo code is required')
      .max(100, 'Promo code is too long')
      .regex(/^[A-Z0-9_-]+$/i, 'Promo code can only contain letters, numbers, underscores, and hyphens')
      .trim(),
    description: z.string().min(1, 'Description is required').max(500, 'Description is too long').trim(),
    discountValue: z.coerce.number().positive('Discount value must be greater than 0'),
    isPercent: z.boolean(),
    notes: z.string().optional().or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    expiryDate: z.string().optional().or(z.literal('')),
  })
  .refine(
    data => {
      // Validate startDate is today or in the future
      if (data.startDate && data.startDate.trim() !== '') {
        const selectedDate = new Date(data.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
        return selectedDate >= today
      }
      return true
    },
    {
      message: 'Start date must be today or in the future',
      path: ['startDate'],
    },
  )
  .refine(
    data => {
      // If expiryDate is provided and not empty, validate it's today or in the future
      if (data.expiryDate && data.expiryDate.trim() !== '') {
        const selectedDate = new Date(data.expiryDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
        return selectedDate >= today
      }
      return true
    },
    {
      message: 'Expiry date must be today or in the future',
      path: ['expiryDate'],
    },
  )
  .refine(
    data => {
      // If expiryDate is provided, validate it's after or equal to startDate
      if (data.expiryDate && data.expiryDate.trim() !== '' && data.startDate && data.startDate.trim() !== '') {
        const startDate = new Date(data.startDate)
        const expiryDate = new Date(data.expiryDate)
        return expiryDate >= startDate
      }
      return true
    },
    {
      message: 'Expiry date must be after or equal to start date',
      path: ['expiryDate'],
    },
  )

export type PromoFormData = z.infer<typeof promoFormSchema>

// Bulk Promo Import validation schema
export const bulkPromoImportSchema = z
  .object({
    promoCode: z.string().min(1, 'Promo code is required').max(100, 'Promo code is too long').trim(),
    description: z.string().min(1, 'Description is required').trim(),
    discountValue: z.coerce.number().positive('Discount value must be greater than 0'),
    isPercent: z.boolean(),
    notes: z.string().optional().or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    expiryDate: z.string().optional().or(z.literal('')),
  })
  .refine(
    data => {
      // Validate startDate is today or in the future
      if (data.startDate && data.startDate.trim() !== '') {
        const selectedDate = new Date(data.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
        return selectedDate >= today
      }
      return true
    },
    {
      message: 'Start date must be today or in the future',
      path: ['startDate'],
    },
  )
  .refine(
    data => {
      // If expiryDate is provided and not empty, validate it's today or in the future
      if (data.expiryDate && data.expiryDate.trim() !== '') {
        const selectedDate = new Date(data.expiryDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
        return selectedDate >= today
      }
      return true
    },
    {
      message: 'Expiry date must be today or in the future',
      path: ['expiryDate'],
    },
  )
  .refine(
    data => {
      // If expiryDate is provided, validate it's after or equal to startDate
      if (data.expiryDate && data.expiryDate.trim() !== '' && data.startDate && data.startDate.trim() !== '') {
        const startDate = new Date(data.startDate)
        const expiryDate = new Date(data.expiryDate)
        return expiryDate >= startDate
      }
      return true
    },
    {
      message: 'Expiry date must be after or equal to start date',
      path: ['expiryDate'],
    },
  )

export type BulkPromoImportData = z.infer<typeof bulkPromoImportSchema>

// ============================================================================
// Product Form Validation
// ============================================================================

/**
 * Product form validation schema
 * Validates product creation and editing
 */
export const productFormSchema = z.object({
  productId: z.number().optional(),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  descriptionHtml: z.string().min(1, 'Description is required'),
  brand: z.string().min(1, 'Brand is required').max(255, 'Brand is too long'),
  color: z.string().min(1, 'Color is required'),
  colorLabel: z.string().min(1, 'Color label is required'),
  condition: z.string().min(1, 'Condition is required'),
  countryOfManufacture: z.string().min(1, 'Country of manufacture is required').max(100, 'Country is too long'),
  model: z.string().max(255, 'Model is too long').default(''),
  upc: z.string().max(50, 'UPC is too long').default(''),
  modificationHtml: z.string().default(''),
  itemModified: z.boolean(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  discount: z.number().min(0, 'Discount must be 0 or greater'),
  isDiscountPercent: z.boolean(),
  returnsAllowed: z.boolean(),
  length: z.number().positive('Length must be positive').optional().nullable(),
  breadth: z.number().positive('Breadth must be positive').optional().nullable(),
  height: z.number().positive('Height must be positive').optional().nullable(),
  weightKgs: z.number().positive('Weight must be positive').optional().nullable(),
  categoryId: z.number().min(1, 'Category is required'),
  categoryFullPath: z.string().optional(),  // Display-only field for category path (e.g., "Electronics > Computers > Laptops")
  // Images - required
  mainImage: z.string().min(1, 'Main image is required'),
  topImage: z.string().min(1, 'Top image is required'),
  bottomImage: z.string().min(1, 'Bottom image is required'),
  frontImage: z.string().min(1, 'Front image is required'),
  backImage: z.string().min(1, 'Back image is required'),
  rightImage: z.string().min(1, 'Right image is required'),
  leftImage: z.string().min(1, 'Left image is required'),
  detailsImage: z.string().min(1, 'Details image is required'),
  // Images - optional
  defectImage: z.string().default(''),
  additionalImage1: z.string().default(''),
  additionalImage2: z.string().default(''),
  additionalImage3: z.string().default(''),
  // Pickup locations - will be managed separately
  pickupLocationQuantities: z.record(z.string(), z.number()).default({}),
  notes: z.string().default(''),
  // Item availability with timezone
  itemAvailableFrom: z
    .object({
      dateTime: z.date().nullable(),
      timezone: z.string().min(1, 'Timezone is required'),
    })
    .refine(data => data.dateTime !== null, {
      message: 'Available from date is required',
    }),
})

export type ProductFormData = z.infer<typeof productFormSchema>

// ============================================================================
// Bulk Product Import Validation
// ============================================================================

/**
 * Bulk product import validation schema
 * Used for validating product data from Excel/CSV files
 */
export const bulkProductImportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  brand: z.string().min(1, 'Brand is required').max(255, 'Brand is too long'),
  model: z.string().max(255, 'Model is too long').optional().or(z.literal('')),
  condition: z.string().min(1, 'Condition is required'),
  color: z.string().min(1, 'Color is required'),
  colorLabel: z.string().min(1, 'Color label is required'),
  countryOfManufacture: z.string().min(1, 'Country is required').max(100, 'Country is too long'),
  categoryId: z.coerce.number().min(1, 'Category ID is required'),
  upc: z.string().max(50, 'UPC is too long').optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  discount: z.coerce.number().min(0, 'Discount must be 0 or greater'),
  isDiscountPercent: z.boolean(),
  returnsAllowed: z.boolean(),
  length: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().positive('Length must be positive').nullable().optional()
  ),
  breadth: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().positive('Breadth must be positive').nullable().optional()
  ),
  height: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().positive('Height must be positive').nullable().optional()
  ),
  weightKgs: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().positive('Weight must be positive').nullable().optional()
  ),
  itemAvailableFrom: z.string().min(1, 'Available from date is required'),
  itemAvailableFromTimezone: z.string().min(1, 'Timezone is required'),
  pickupLocationQuantities: z.string().min(1, 'At least one pickup location with stock is required'),
  mainImage: z.string().url('Main image must be a valid URL').min(1, 'Main image is required'),
  topImage: z.string().url('Top image must be a valid URL').min(1, 'Top image is required'),
  bottomImage: z.string().url('Bottom image must be a valid URL').min(1, 'Bottom image is required'),
  frontImage: z.string().url('Front image must be a valid URL').min(1, 'Front image is required'),
  backImage: z.string().url('Back image must be a valid URL').min(1, 'Back image is required'),
  rightImage: z.string().url('Right image must be a valid URL').min(1, 'Right image is required'),
  leftImage: z.string().url('Left image must be a valid URL').min(1, 'Left image is required'),
  detailsImage: z.string().url('Details image must be a valid URL').min(1, 'Details image is required'),
  defectImage: z.string().url('Defect image must be a valid URL').optional().or(z.literal('')),
  additionalImage1: z.string().url('Additional image 1 must be a valid URL').optional().or(z.literal('')),
  additionalImage2: z.string().url('Additional image 2 must be a valid URL').optional().or(z.literal('')),
  additionalImage3: z.string().url('Additional image 3 must be a valid URL').optional().or(z.literal('')),
  descriptionHtml: z.string().min(1, 'Description is required'),
  itemModified: z.boolean(),
  modificationHtml: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type BulkProductImportData = z.infer<typeof bulkProductImportSchema>

// ============================================================================
// Package Validation Schemas
// ============================================================================

// Package type options are defined in appConstants.ts
// Import from there: import { PACKAGE_TYPE_OPTIONS, type PackageType } from '../constants/appConstants'

// Package form validation schema - matches PackageRequestModel from backend
export const packageFormSchema = z.object({
  packageName: z
    .string()
    .min(1, 'Package name is required')
    .max(255, 'Package name is too long')
    .trim(),
  length: z.coerce
    .number()
    .int('Length must be a whole number')
    .positive('Length must be greater than 0'),
  breadth: z.coerce
    .number()
    .int('Breadth must be a whole number')
    .positive('Breadth must be greater than 0'),
  height: z.coerce
    .number()
    .int('Height must be a whole number')
    .positive('Height must be greater than 0'),
  maxWeight: z.coerce
    .number()
    .min(0, 'Max weight cannot be negative'),
  standardCapacity: z.coerce
    .number()
    .int('Standard capacity must be a whole number')
    .positive('Standard capacity must be greater than 0'),
  pricePerUnit: z.coerce
    .number()
    .min(0, 'Price per unit cannot be negative'),
  packageType: z.enum(['STANDARD', 'FRAGILE', 'OVERSIZED', 'ENVELOPE', 'BOX', 'TUBE', 'CUSTOM'], {
    required_error: 'Package type is required',
    invalid_type_error: 'Invalid package type',
  }),
  // Pickup locations - managed by PickupLocationQuantityManager component (package variant)
  // Each location has quantity, reorderLevel, and maxStockLevel
  // Pickup locations - managed by PickupLocationQuantityManager component (package variant)
  // Each location has quantity, reorderLevel, maxStockLevel, and lastRestockDate
  pickupLocationQuantities: z.record(
    z.string(),
    z.object({
      quantity: z.number().min(0, 'Quantity cannot be negative'),
      reorderLevel: z.number().min(0, 'Reorder level cannot be negative'),
      maxStockLevel: z.number().min(1, 'Max stock level must be at least 1'),
      lastRestockDate: z.string().optional(), // ISO date string, nullable
    })
  ).default({}),
  notes: z.string().optional().or(z.literal('')),
})

export type PackageFormData = z.infer<typeof packageFormSchema>

// ============================================================================
// Pickup Location Validation
// ============================================================================

/**
 * Pickup Location form validation schema
 * Used for add/edit pickup location forms
 */
export const pickupLocationFormSchema = z.object({
  // Location Information
  addressNickName: z.string().min(1, 'Location name is required').max(100, 'Location name must be less than 100 characters'),
  shipRocketPickupLocationId: z.string().optional().or(z.literal('')),
  // Address fields (using AddressFormData structure)
  address: z.object({
    streetAddress: z.string().min(1, 'Street address is required'),
    streetAddress2: z.string().optional().or(z.literal('')),
    streetAddress3: z.string().optional().or(z.literal('')),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(6, 'Postal code must be at least 6 characters').max(10, 'Postal code is too long'),
    country: z.string().min(1, 'Country is required'),
    addressType: z.string().min(1, 'Address type is required'),
    nameOnAddress: z.string().optional().or(z.literal('')),
    emailOnAddress: z.string().email('Invalid email format').optional().or(z.literal('')),
    phoneOnAddress: z.string().optional().or(z.literal('')),
  }),
  notes: z.string().optional().or(z.literal('')),
})

export type PickupLocationFormData = z.infer<typeof pickupLocationFormSchema>
