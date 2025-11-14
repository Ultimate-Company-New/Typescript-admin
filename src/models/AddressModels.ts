/**
 * Address Models
 * Type definitions for address-related data structures
 */

/**
 * Address Request Model
 * Used when creating or updating an address
 */
export interface AddressRequestModel {
  addressId?: number
  userId?: number
  clientId?: number
  street1?: string
  street2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  addressType?: string
  isPrimary?: boolean
}

/**
 * Address Response Model
 * Returned from the API when fetching address data
 */
export interface AddressResponseModel {
  addressId: number
  userId?: number
  clientId?: number
  street1: string
  street2?: string
  city: string
  state: string
  zipCode: string
  country: string
  addressType: string
  isPrimary: boolean
  createdAt?: string
  updatedAt?: string
}

