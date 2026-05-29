/**
 * Lead-related TypeScript interfaces matching the Spring API models
 * @see LeadRequestModel.java
 * @see LeadResponseModel.java
 */

import { type AddressRequestModel, type AddressResponseModel } from './AddressModels'
import { type FilterCondition } from './UserModels'

/**
 * Simplified user info for lead relationships
 */
export interface LeadUserInfo {
  userId: number
  firstName: string
  lastName: string
  loginName: string
}

/**
 * Lead Request Model
 * Used for creating/updating leads and pagination requests
 * Matches: LeadRequestModel.java
 */
export interface LeadRequestModel {
  // Lead identification
  leadId?: number

  // Lead personal info
  firstName?: string
  lastName?: string
  email?: string
  phone?: string

  // Lead status
  leadStatus?: string
  isDeleted?: boolean

  // Company info
  company?: string
  companySize?: number
  annualRevenue?: string
  title?: string
  website?: string
  fax?: string

  // Notes
  notes?: string

  // Related entities
  addressId?: number
  createdById?: number
  assignedAgentId?: number

  // Address for creation/update
  address?: AddressRequestModel

  // Pagination fields (extends PaginationBaseRequestModel)
  start?: number
  end?: number
  pageSize?: number
  includeDeleted?: boolean

  // Multi-filter support
  logicOperator?: 'AND' | 'OR'
  filters?: FilterCondition[]

  // Legacy pagination fields
  pageNumber?: number
  sortBy?: string
  sortDirection?: string
  filter?: string
}

/**
 * Lead Response Model
 * Returned from API when fetching lead data
 * Matches: LeadResponseModel.java
 */
export interface LeadResponseModel {
  // Lead identification
  leadId: number

  // Lead personal info
  firstName: string
  lastName: string
  email: string
  phone: string

  // Lead status
  leadStatus: string
  isDeleted: boolean

  // Company info
  company: string
  companySize: number
  annualRevenue: string
  title: string
  website: string
  fax: string

  // Notes
  notes?: string

  // Related entity IDs
  addressId: number
  createdById: number
  assignedAgentId?: number

  // Audit fields
  createdAt: string
  createdUser: string
  updatedAt: string
  modifiedUser: string

  // Related entities (populated by backend)
  address: AddressResponseModel
  createdByUser?: LeadUserInfo
  assignedAgent?: LeadUserInfo

  // Computed fields (calculated by backend)
  fullName: string
  displayName: string
  statusColor: string
  isAssigned: boolean
  isActive: boolean
  daysOld: number
  companySizeDisplay: string
}

/**
 * Lead Details Response Model
 * Alias for LeadResponseModel - used for individual lead view/edit endpoints
 * The backend returns the same flat structure for both list and details
 */
export type LeadDetailsResponseModel = LeadResponseModel

/**
 * Bulk Lead Insert Result
 * Individual result for each lead in bulk insert
 */
export interface BulkLeadResult {
  identifier: string // email
  success: boolean
  entityId?: number // leadId
  errorMessage?: string
}

/**
 * Bulk Lead Insert Response Model
 * Response from bulk lead creation endpoint
 */
export interface BulkLeadInsertResponseModel {
  totalRequested: number
  successCount: number
  failureCount: number
  successResults: BulkLeadResult[]
  failureResults: BulkLeadResult[]
}

