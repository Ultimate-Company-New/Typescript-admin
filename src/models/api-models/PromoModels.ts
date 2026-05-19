/**
 * Promo-related TypeScript interfaces matching the Spring API models
 * @see PromoRequestModel.java
 * @see PromoResponseModel.java
 */

import { type FilterCondition } from './UserModels'

/**
 * Promo Request Model
 * Used for creating/updating promos and pagination requests
 * Matches: PromoRequestModel.java
 */
export interface PromoRequestModel {
  // Promo identification
  promoId?: number

  // Promo details
  promoCode?: string
  description?: string
  discountValue?: number
  isPercent?: boolean
  isDeleted?: boolean

  // Notes
  notes?: string

  // Date range
  startDate: string // Required
  expiryDate?: string

  // Pagination fields (extends PaginationBaseRequestModel)
  start?: number
  end?: number
  pageSize?: number
  includeDeleted?: boolean

  // Multi-filter support
  logicOperator?: 'AND' | 'OR'
  filters?: FilterCondition[]
}

/**
 * Promo Response Model
 * Returned from API when fetching promo data
 * Matches: PromoResponseModel.java
 */
export interface PromoResponseModel {
  // Promo identification
  promoId: number

  // Promo details
  promoCode: string
  description: string
  discountValue: number
  isPercent: boolean
  isDeleted: boolean

  // Notes
  notes?: string

  // Date range
  startDate: string // Required
  expiryDate?: string

  // Related entity IDs

  // Audit fields
  createdAt: string
  createdUser: string
  updatedAt: string
  modifiedUser: string

  // Computed fields (calculated by backend)
  discountDisplay: string
  isActive: boolean
  promoType: string
}

/**
 * Promo Details Response Model
 * Alias for PromoResponseModel - used for individual promo view/edit endpoints
 */
export type PromoDetailsResponseModel = PromoResponseModel

/**
 * Bulk Promo Insert Result
 * Individual result for each promo in bulk insert
 */
export interface BulkPromoResult {
  identifier: string // promoCode
  success: boolean
  entityId?: number // promoId
  errorMessage?: string
}

/**
 * Bulk Promo Insert Response Model
 * Response from bulk promo creation endpoint
 */
export interface BulkPromoInsertResponseModel {
  totalRequested: number
  successCount: number
  failureCount: number
  successResults: BulkPromoResult[]
  failureResults: BulkPromoResult[]
}
