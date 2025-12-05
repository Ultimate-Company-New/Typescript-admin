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
