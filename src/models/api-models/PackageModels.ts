import type { PackageProductResponseData } from "./ShipmentModels";

/**
 * Package API Models
 * Type definitions for package-related API requests and responses
 */

/**
 * Package pickup location mapping request model
 * Used for creating and updating package stock at each location
 * Maps to PackagePickupLocationMappingRequestModel from Spring API backend
 */
export interface PackagePickupLocationMappingRequestModel {
  /** Available quantity of packages at this location (availableQuantity column) */
  quantity: number
  /** When to reorder packages - alert threshold (reorderLevel column, default 10) */
  reorderLevel: number
  /** Maximum stock level to maintain (maxStockLevel column, default 1000) */
  maxStockLevel: number
  /** When packages were last restocked at this location (lastRestockDate column, nullable) */
  lastRestockDate?: string
  /** Optional notes about this mapping */
  notes?: string
}

/**
 * Package pickup location mapping response model
 * Returned from API with full audit information
 * Maps to PackagePickupLocationMappingResponseModel from Spring API backend
 */
export interface PackagePickupLocationMappingResponseModel {
  /** Unique identifier for this mapping */
  packagePickupLocationMappingId?: number
  /** Available quantity of packages at this location (availableQuantity column) */
  quantity: number
  /** When to reorder packages - alert threshold (reorderLevel column, default 10) */
  reorderLevel: number
  /** Maximum stock level to maintain (maxStockLevel column, default 1000) */
  maxStockLevel: number
  /** When packages were last restocked at this location (lastRestockDate column, nullable) */
  lastRestockDate?: string
  /** The package ID this mapping belongs to */
  packageId?: number
  /** The pickup location ID this mapping belongs to */
  pickupLocationId?: number
  /** Optional notes about this mapping */
  notes?: string
  // Audit fields
  /** The user who created this mapping */
  createdUser?: string
  /** The user who last modified this mapping */
  modifiedUser?: string
  /** When this mapping was created */
  createdAt?: string
  /** When this mapping was last updated */
  updatedAt?: string
}

/**
 * Package Request Model
 * Used for creating and updating packages
 * Matches PackageRequestModel from Spring API backend
 */
export interface PackageRequestModel {
  packageId?: number
  packageName: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  packageType: string
  notes?: string
  /** Pickup location data - map of locationId to PackagePickupLocationMappingRequestModel */
  pickupLocationQuantities?: Record<number, PackagePickupLocationMappingRequestModel>
}

/**
 * Package Response Model
 * Returned from API when fetching package details
 * Matches PackageResponseModel from Spring API backend
 */
export interface PackageResponseModel {
  packageId: number
  packageName: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  packageType: string
  notes?: string
  isDeleted?: boolean
  clientId?: number
  createdAt?: string
  createdUser?: string
  updatedAt?: string
  modifiedUser?: string
  /** Pickup location data - map of locationId to PackagePickupLocationMappingResponseModel */
  pickupLocationQuantities?: Record<number, PackagePickupLocationMappingResponseModel>

  // Shipment-specific fields (only populated when package is part of a shipment)
  quantityUsed?: number
  totalCost?: number

  // Products in this package (only populated when package is part of a shipment)
  products?: PackageProductResponseData[]
}

/**
 * Package data structure for grid display
 * Used in PackageGridColumns.tsx
 */
export interface PackageData {
  packageId?: number
  _package?: {
    packageId: number
    packageName?: string
    packageType?: string
    length?: number
    breadth?: number
    width?: number
    height?: number
    maxWeight?: number
    pricePerUnit?: number
    pickupLocationQuantities?: Record<number, PackagePickupLocationMappingResponseModel>
  }
  packageName?: string
  packageType?: string
  length?: number
  breadth?: number
  width?: number
  height?: number
  maxWeight?: number
  pricePerUnit?: number
  isDeleted?: boolean
  deleted?: boolean
  pickupLocationQuantities?: Record<number, PackagePickupLocationMappingResponseModel>
}

/**
 * Package type values matching database constraint
 * CHECK (packageType IN ('STANDARD', 'FRAGILE', 'OVERSIZED', 'ENVELOPE', 'BOX', 'TUBE', 'CUSTOM'))
 */
export type PackageType = 'STANDARD' | 'FRAGILE' | 'OVERSIZED' | 'ENVELOPE' | 'BOX' | 'TUBE' | 'CUSTOM'
