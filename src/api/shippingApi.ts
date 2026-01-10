import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Shipping'

/**
 * Courier option from shipping calculation
 */
export interface CourierOption {
  courierCompanyId: number
  id?: number
  courierName: string
  courierType: string
  description?: string
  rate: number
  codCharges: number
  freightCharge: number
  rtoCharges?: number
  coverageCharges?: number
  otherCharges?: number
  cost?: string
  estimatedDeliveryDays: string
  etd: string
  etdHours?: number
  edd?: string
  rating: number
  deliveryPerformance: number
  pickupPerformance: number
  rtoPerformance?: number
  trackingPerformance?: number
  rank?: string
  city: string
  state: string
  postcode?: string
  zone?: string
  chargeWeight: number
  minWeight?: number
  baseWeight?: string
  airMaxWeight?: string
  surfaceMaxWeight?: string
  isSurface: boolean
  isHyperlocal?: boolean
  realtimeTracking: string
  callBeforeDelivery?: string
  podAvailable?: string
  isRtoAddressAvailable?: boolean
  pickupAvailability?: string
  cutoffTime?: string
  blocked?: number
  cod?: number
}

// ============================================================================
// Order Optimization Types (new endpoint)
// ============================================================================

/**
 * Request for order-level shipping optimization
 */
export interface OrderOptimizationRequest {
  productQuantities: Record<number, number>
  deliveryPostcode: string
  isCod: boolean
  /**
   * Optional: User-defined product allocations.
   * Map of productId -> (pickupLocationId -> quantity)
   * If provided, skips auto-optimization and uses these allocations directly.
   */
  customAllocations?: Record<number, Record<number, number>>
}

/**
 * Package info from optimization response
 */
export interface PackageInfo {
  packageId: number
  packageName: string
  packageType: string
  length?: number
  breadth?: number
  height?: number
  maxWeight?: number
  pricePerUnit?: number
}

/**
 * Product detail in a package.
 * Only includes productId - full product details are in Shipment.products list.
 */
export interface PackageProductDetail {
  productId: number
  quantity: number
}

/**
 * Package usage in a shipment
 */
export interface PackageUsage {
  packageInfo: PackageInfo
  quantityUsed: number
  totalCost: number
  productIds: number[]
  productDetails: PackageProductDetail[]
}

/**
 * Product info from optimization response
 */
export interface ProductInfo {
  productId: number
  title: string
  weightKgs?: number
  length?: number
  breadth?: number
  height?: number
  mainImageUrl?: string
  price?: number
  discount?: number
  isDiscountPercent?: boolean
}

/**
 * Product allocation to a location
 */
export interface ProductAllocation {
  product: ProductInfo
  allocatedQuantity: number
  totalWeight: number
}

/**
 * Address info from pickup location
 */
export interface AddressInfo {
  addressId?: number
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
}

/**
 * Pickup location info from optimization response
 */
export interface PickupLocationInfo {
  pickupLocationId: number
  addressNickName: string
  address?: AddressInfo
}

/**
 * Shipment from one pickup location
 */
export interface OptimizationShipment {
  pickupLocation: PickupLocationInfo
  products: ProductAllocation[]
  totalWeightKgs: number
  totalQuantity: number
  packagesUsed: PackageUsage[]
  packagingCost: number
  /** Shipping cost based on cheapest available courier */
  shippingCost: number
  /** Total cost for this shipment (packagingCost + shippingCost) */
  totalCost: number
  /** Available courier options sorted by rate (cheapest first). Frontend should select from this list. */
  availableCouriers: CourierOption[]
}

/**
 * Response from order optimization endpoint
 * Returns the single cheapest allocation option directly
 */
export interface OrderOptimizationResponse {
  /** Description of the allocation (e.g., "All from Bangalore" or "Split: Mumbai + Bangalore") */
  description: string
  /** Total cost = packaging + shipping */
  totalCost: number
  /** Total packaging cost across all locations */
  totalPackagingCost: number
  /** Total shipping cost across all locations */
  totalShippingCost: number
  /** Number of separate shipments */
  shipmentCount: number
  /** List of shipments, one per pickup location used */
  shipments: OptimizationShipment[]
  /** Whether this allocation can fulfill the entire order */
  canFulfillOrder: boolean
  /** If cannot fulfill, the shortfall amount */
  shortfall?: number
  /** Whether all shipments have available couriers */
  allCouriersAvailable: boolean
  /** Reason why allocation is not available */
  unavailabilityReason?: string
  /** Total number of products in the request */
  totalProductCount: number
  /** Total quantity of items across all products */
  totalQuantity: number
  /** Error message if optimization failed */
  errorMessage?: string
  /** Whether the optimization was successful */
  success: boolean
}

/**
 * Shipping options for a single pickup location
 */
export interface LocationShippingOptions {
  pickupLocationId: number
  locationName: string
  pickupPostcode: string
  totalWeightKgs: number
  totalQuantity: number
  productIds: number[]
  availableCouriers: CourierOption[]
  selectedCourier?: CourierOption
}

/**
 * Response from shipping calculation
 */
export interface ShippingCalculationResponse {
  locationOptions: LocationShippingOptions[]
  totalShippingCost: number
}

/**
 * Pickup location shipment details for request
 */
export interface PickupLocationShipment {
  pickupLocationId: number
  locationName: string
  pickupPostcode: string
  totalWeightKgs: number
  totalQuantity: number
  productIds: number[]
}

/**
 * Request for calculating shipping
 */
export interface ShippingCalculationRequest {
  deliveryPostcode: string
  isCod: boolean
  pickupLocations: PickupLocationShipment[]
}

/**
 * Shipping API Service
 */
export const shippingApi = {
  /**
   * Calculate shipping options for an order (legacy - uses pre-allocated locations)
   * Groups products by pickup location and returns available couriers
   */
  calculateShipping: async (request: ShippingCalculationRequest): Promise<ShippingCalculationResponse> => {
    const response = await axiosInstance.post<ShippingCalculationResponse>(
      `${API_BASE_URL}/calculateShipping`,
      request
    )
    return response.data
  },

  /**
   * Optimize order fulfillment - NEW ENDPOINT
   * Takes product quantities and delivery postcode, returns optimal allocation options
   * ranked by total cost (shipping + packaging).
   *
   * This endpoint handles:
   * - Finding optimal pickup locations based on stock, packaging, and shipping costs
   * - Calculating packaging requirements for each location
   * - Fetching real-time shipping rates from couriers
   * - Returning multiple options for user to choose from
   */
  optimizeOrder: async (request: OrderOptimizationRequest): Promise<OrderOptimizationResponse> => {
    const response = await axiosInstance.post<OrderOptimizationResponse>(
      `${API_BASE_URL}/optimizeOrder`,
      request
    )
    return response.data
  },

  /**
   * Get the ShipRocket wallet balance for the client
   * @returns The wallet balance as a number
   */
  getWalletBalance: async (): Promise<number> => {
    const response = await axiosInstance.get<number>(`${API_BASE_URL}/getWalletBalance`)
    return response.data
  },
}

export default shippingApi
