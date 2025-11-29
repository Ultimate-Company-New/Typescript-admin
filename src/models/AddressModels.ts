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
  streetAddress?: string
  streetAddress2?: string
  streetAddress3?: string
  // Legacy field names retained for backward compatibility
  street1?: string
  street2?: string
  street3?: string
  city?: string
  state?: string
  postalCode?: string
  zipCode?: string // Keep for backward compatibility
  country?: string
  addressType?: string
  isPrimary?: boolean
  nameOnAddress?: string
  emailOnAddress?: string
  phoneOnAddress?: string
}

/**
 * Address Response Model
 * Returned from the API when fetching address data
 */
export interface AddressResponseModel {
  addressId: number
  userId?: number
  clientId?: number
  streetAddress: string
  streetAddress2?: string
  streetAddress3?: string
  city: string
  state: string
  postalCode?: string
  zipCode?: string // Keep for backward compatibility
  country: string
  addressType: string
  nameOnAddress?: string
  emailOnAddress?: string
  phoneOnAddress?: string
  isPrimary: boolean
  createdAt?: string
  updatedAt?: string
}
