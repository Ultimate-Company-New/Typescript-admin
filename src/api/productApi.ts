import type { ProductRequestModel } from '../models/api-models'
import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Product'

/**
 * Product API Service
 * Handles all product-related API calls
 */
export const productApi = {
  /**
   * Get paginated products with filtering and sorting
   */
  getProductsInBatches: async (request: PaginationBaseRequestModel): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getProductsInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get product details by ID
   */
  getProductById: async (productId: number): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(`${API_BASE_URL}/getProductDetailsById/${productId}`)
    return response.data
  },

  /**
   * Create a new product
   */
  createProduct: async (request: unknown): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/addProduct`, request)
    return response.data
  },

  /**
   * Update an existing product
   */
  updateProduct: async (_productId: number, request: unknown): Promise<unknown> => {
    // Note: productId is in the request body, not the URL path
    const response = await axiosInstance.post<unknown>(`${API_BASE_URL}/editProduct`, request)
    return response.data
  },

  /**
   * Toggle product (activate/deactivate)
   */
  toggleProduct: async (productId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/toggleDeleteProduct/${productId}`)
    return response.data
  },

  /**
   * Toggle product returns allowed status
   */
  toggleProductReturns: async (productId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/toggleReturnProduct/${productId}`)
    return response.data
  },

  /**
   * Bulk create products
   * Triggers async processing - results sent via notification
   */
  bulkCreateProducts: async (products: ProductRequestModel[]): Promise<void> => {
    await axiosInstance.put<void>(`${API_BASE_URL}/bulkAddProduct`, products)
  },

  /**
   * Get product image URL
   */
  getProductImageUrl: (productId: number, imageName: string = 'Main'): string => {
    // Determine base URL based on environment
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''

    const baseUrl = isLocalhost
      ? 'http://localhost:4433/api'
      : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4433/api')

    return `${baseUrl}${API_BASE_URL}/getProductImage?imageName=${imageName}&productId=${productId}`
  },

  /**
   * Get product stock information across all pickup locations
   * Returns stock availability with location address details
   * @param productId - The product ID
   */
  getProductStockAtLocationsByProductId: async (productId: number): Promise<ProductStockByLocation[]> => {
    // Use 0 for quantity and deliveryPostcode to indicate no estimates needed
    const response = await axiosInstance.get<ProductStockByLocation[]>(
      `${API_BASE_URL}/getProductStockAtLocationsByProductId/${productId}/0/0/false`,
    )
    return response.data
  },

  /**
   * Calculate estimates for a product across pickup locations
   * Returns packaging estimates and shipping options
   * @param productId - The product ID
   * @param quantity - Quantity to calculate for
   * @param deliveryPostcode - Delivery address postal code (for shipping options)
   * @param isCod - Whether order is Cash on Delivery
   */
  calculateProductEstimates: async (
    productId: number,
    quantity: number,
    deliveryPostcode: string,
    isCod: boolean = false
  ): Promise<ProductStockByLocation[]> => {
    const response = await axiosInstance.get<ProductStockByLocation[]>(
      `${API_BASE_URL}/getProductStockAtLocationsByProductId/${productId}/${quantity}/${deliveryPostcode}/${isCod}`,
    )
    return response.data
  },
}

/**
 * Package information at a pickup location
 */
export interface PackageInfo {
  packageId: number
  packageName: string
  packageType: string
  pricePerUnit: number      // Price per package
  availableQuantity: number // Number of packages available
  // Package dimensions for capacity calculation
  packageLength: number
  packageBreadth: number
  packageHeight: number
  maxWeight: number
}

/**
 * Package usage - how many of each package type are needed
 */
export interface PackageUsage {
  packageId: number
  packageName: string
  packageType: string
  quantityUsed: number
  pricePerUnit: number
  totalCost: number
}

/**
 * Courier/shipping option - comprehensive data from Shiprocket API
 */
export interface CourierOption {
  // Basic identification
  courierCompanyId: number
  id?: number
  courierName: string
  courierType: string // e.g., "Surface", "Air"
  description?: string

  // Pricing
  rate: number // Total shipping cost
  codCharges: number // COD charges if applicable
  freightCharge: number
  rtoCharges?: number // Return to origin charges
  coverageCharges?: number
  otherCharges?: number
  entryTax?: number
  cost?: string
  codMultiplier?: number

  // Delivery information
  estimatedDeliveryDays: string
  etd: string // Estimated time of delivery (human readable)
  etdHours?: number // ETD in hours
  edd?: string // Expected delivery date

  // Performance metrics (0-5 for rating, percentage for others)
  rating: number
  deliveryPerformance: number
  pickupPerformance: number
  rtoPerformance?: number
  trackingPerformance?: number
  rank?: string

  // Location info
  city: string
  state: string
  postcode?: string
  zone?: string
  region?: number
  localRegion?: number
  metro?: number

  // Weight and dimensions
  chargeWeight: number
  minWeight?: number
  baseWeight?: string
  airMaxWeight?: string
  surfaceMaxWeight?: string
  volumetricMaxWeight?: number
  weightCases?: number

  // Service features
  isSurface: boolean
  isHyperlocal?: boolean
  isInternational?: number
  realtimeTracking: string
  callBeforeDelivery?: string
  podAvailable?: string // Proof of delivery
  isRtoAddressAvailable?: boolean
  qcCourier?: number // Quality check courier
  secureShipmentDisabled?: boolean
  odablock?: boolean // Out of delivery area block

  // Pickup information
  pickupAvailability?: string
  pickupPriority?: string
  pickupSupressHours?: number
  secondsLeftForPickup?: number
  cutoffTime?: string

  // Suppression/delay info
  suppressDate?: string
  suppressText?: string

  // Status flags
  blocked?: number
  cod?: number // COD available (1/0)
  isCustomRate?: number
  shipType?: number
  mode?: number

  // Other
  assuredAmount?: number
  deliveryBoyContact?: string
  others?: string
}

/**
 * Product stock information at a pickup location
 */
export interface ProductStockByLocation {
  pickupLocationId: number
  locationName: string
  availableStock: number
  minStockLevel: number
  maxStockLevel: number
  reorderLevel: number
  // Address fields
  addressType?: string
  streetAddress?: string
  streetAddress2?: string
  streetAddress3?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  nameOnAddress?: string
  emailOnAddress?: string
  phoneOnAddress?: string
  // Package information
  availablePackages: PackageInfo[]
  // Product dimensions
  productLength?: number
  productBreadth?: number
  productHeight?: number
  productWeightKgs?: number
  // Packaging estimate (calculated by backend based on dimensions)
  packagingEstimate: PackageUsage[]
  totalPackagingCost: number
  maxItemsPackable: number
  // Shipping options (sorted by price, lowest first)
  availableCouriers: CourierOption[]
  selectedCourier?: CourierOption
}

export default productApi
