/**
 * Distance calculation utilities using pincode-distance npm package
 * Uses Haversine formula for accurate distance calculation between Indian pincodes
 */

// @ts-expect-error - pincode-distance doesn't have TypeScript types
import Pincode from 'pincode-distance'

import type { CourierOption, PackageInfo } from '../api/productApi'

// Initialize the pincode instance
const pincodeInstance = new Pincode()

/**
 * Calculate distance in kilometers between two Indian pincodes
 *
 * @param pincode1 First pincode
 * @param pincode2 Second pincode
 * @returns Distance in kilometers, or Infinity if calculation fails
 */
export const calculatePincodeDistance = (pincode1: string, pincode2: string): number => {
  try {
    const p1 = (pincode1 || '').replace(/\D/g, '').substring(0, 6)
    const p2 = (pincode2 || '').replace(/\D/g, '').substring(0, 6)

    if (p1.length !== 6 || p2.length !== 6) {
      return Infinity
    }

    // Same pincode = 0 distance
    if (p1 === p2) {
      return 0
    }

    const distance = pincodeInstance.getDistance(p1, p2)
    return typeof distance === 'number' && !isNaN(distance) ? distance : Infinity
  } catch {
    return Infinity
  }
}

/**
 * Sort locations by distance from a reference address
 *
 * @param locations Array of locations with postalCode
 * @param referenceAddress The delivery/reference address with postalCode
 * @returns Sorted array with distance in km
 */
export const sortLocationsByDistance = <T extends { postalCode?: string }>(
  locations: T[],
  referenceAddress: { postalCode?: string }
): Array<T & { distanceKm: number }> => {
  if (!referenceAddress.postalCode) {
    // If no reference postal code, return with Infinity distance
    return locations.map(loc => ({ ...loc, distanceKm: Infinity }))
  }

  return locations
    .map(location => ({
      ...location,
      distanceKm: calculatePincodeDistance(location.postalCode || '', referenceAddress.postalCode || ''),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

/**
 * Package usage for an allocation (matches backend PackageUsageModel)
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
 * Calculate packaging requirements based on product and package dimensions.
 * Uses bin-packing approach: fits products into packages based on volume.
 * Optimizes for cost - uses cheapest packages first.
 *
 * @param itemCount Number of items to pack
 * @param packages Available packages with dimensions
 * @param productDimensions Product dimensions (length, breadth, height in same units as packages)
 * @returns Packaging estimate with packages used and total cost
 */
export const calculatePackagingFromDimensions = (
  itemCount: number,
  packages: PackageInfo[],
  productDimensions?: { length?: number; breadth?: number; height?: number }
): { packagingEstimate: PackageUsage[]; totalPackagingCost: number; maxItemsPackable: number } => {
  if (itemCount <= 0 || packages.length === 0) {
    return { packagingEstimate: [], totalPackagingCost: 0, maxItemsPackable: 0 }
  }

  // Calculate product volume (default to 1 if no dimensions)
  const productLength = productDimensions?.length || 1
  const productBreadth = productDimensions?.breadth || 1
  const productHeight = productDimensions?.height || 1
  const productVolume = productLength * productBreadth * productHeight

  // Calculate how many items fit in each package type based on volume
  interface PackageWithCapacity extends PackageInfo {
    itemCapacity: number
    volume: number
    costPerItem: number
    remainingQty: number
  }

  const packagesWithCapacity: PackageWithCapacity[] = packages
    .filter(pkg => pkg.availableQuantity > 0)
    .map(pkg => {
      const pkgVolume = pkg.packageLength * pkg.packageBreadth * pkg.packageHeight
      // How many products fit in this package (by volume)
      const itemCapacity = Math.max(1, Math.floor(pkgVolume / productVolume))
      const costPerItem = pkg.pricePerUnit / itemCapacity
      return {
        ...pkg,
        itemCapacity,
        volume: pkgVolume,
        costPerItem,
        remainingQty: pkg.availableQuantity,
      }
    })
    // Sort by cost per item (cheapest first for cost optimization)
    .sort((a, b) => a.costPerItem - b.costPerItem)

  // Calculate max items that can be packed
  const maxItemsPackable = packagesWithCapacity.reduce(
    (sum, pkg) => sum + pkg.itemCapacity * pkg.remainingQty,
    0
  )

  // Allocate items to packages
  const packagingEstimate: PackageUsage[] = []
  let remainingItems = itemCount
  let totalPackagingCost = 0

  for (const pkg of packagesWithCapacity) {
    if (remainingItems <= 0) break
    if (pkg.remainingQty <= 0) continue

    // How many packages of this type do we need?
    const packagesNeeded = Math.ceil(remainingItems / pkg.itemCapacity)
    const packagesUsed = Math.min(packagesNeeded, pkg.remainingQty)
    const itemsPacked = Math.min(remainingItems, packagesUsed * pkg.itemCapacity)

    if (packagesUsed > 0) {
      packagingEstimate.push({
        packageId: pkg.packageId,
        packageName: pkg.packageName,
        packageType: pkg.packageType,
        quantityUsed: packagesUsed,
        pricePerUnit: pkg.pricePerUnit,
        totalCost: packagesUsed * pkg.pricePerUnit,
      })
      totalPackagingCost += packagesUsed * pkg.pricePerUnit
      remainingItems -= itemsPacked
      pkg.remainingQty -= packagesUsed
    }
  }

  return { packagingEstimate, totalPackagingCost, maxItemsPackable }
}

/**
 * Stock allocation result for a pickup location
 */
export interface StockAllocation {
  pickupLocationId: number
  locationName: string
  allocatedQuantity: number
  availableStock: number
  distanceKm: number
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
  // Package info
  packagingEstimate: PackageUsage[]
  totalPackagingCost: number
  maxItemsPackable: number
  // Shipping info
  availableCouriers: CourierOption[]
  selectedCourier?: CourierOption
}

export interface AllocationResult {
  success: boolean
  allocations: StockAllocation[]
  totalAllocated: number
  totalAvailable: number
  totalPackagingCost: number
  totalShippingCost: number
  shortfall: number
  error?: string
}

/**
 * Allocate quantity across multiple pickup locations based on distance, stock availability,
 * and packaging capacity. Calculates packaging on the fly using dimensions.
 *
 * @param locations Pickup locations with stock and package info
 * @param requestedQuantity Total quantity needed
 * @param productDimensions Product dimensions for packaging calculation
 * @returns Allocation result with locations, quantities, and packaging info
 */
export const allocateQuantityAcrossLocations = (
  locations: Array<{
    pickupLocationId: number
    locationName: string
    availableStock: number
    distanceKm: number
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
    // Available packages at this location
    availablePackages?: PackageInfo[]
    // Shipping options from backend (when estimates are calculated)
    availableCouriers?: CourierOption[]
    selectedCourier?: CourierOption
    // Backend packaging estimates (when estimates are calculated)
    packagingEstimate?: PackageUsage[]
    totalPackagingCost?: number
    maxItemsPackable?: number
  }>,
  requestedQuantity: number,
  productDimensions?: { length?: number; breadth?: number; height?: number },
  useBackendEstimates: boolean = false
): AllocationResult => {
  // Calculate total available stock
  const totalAvailable = locations.reduce((sum, loc) => sum + loc.availableStock, 0)

  // Check if total stock is sufficient
  if (totalAvailable < requestedQuantity) {
    return {
      success: false,
      allocations: [],
      totalAllocated: 0,
      totalAvailable,
      totalPackagingCost: 0,
      totalShippingCost: 0,
      shortfall: requestedQuantity - totalAvailable,
      error: `Insufficient stock. Requested: ${requestedQuantity}, Available: ${totalAvailable}`,
    }
  }

  // Allocate quantity starting from closest location
  const allocations: StockAllocation[] = []
  let remainingQuantity = requestedQuantity
  let totalPackagingCost = 0
  let totalShippingCost = 0

  for (const location of locations) {
    if (remainingQuantity <= 0) break

    // Use backend estimates if available, otherwise calculate locally
    let maxItemsPackable: number
    let packagingEstimate: PackageUsage[]
    let locationPackagingCost: number
    let hasPackages: boolean

    if (useBackendEstimates && location.packagingEstimate && location.maxItemsPackable !== undefined) {
      // Use backend-calculated estimates
      maxItemsPackable = location.maxItemsPackable
      packagingEstimate = location.packagingEstimate
      locationPackagingCost = location.totalPackagingCost || 0
      // Check if this location actually has packages
      hasPackages = location.maxItemsPackable > 0 || Boolean(location.availablePackages && location.availablePackages.length > 0)
    } else {
      // Calculate locally using dimensions
      const packages = location.availablePackages || []
      hasPackages = packages.length > 0
      const result = calculatePackagingFromDimensions(
        location.availableStock,
        packages,
        productDimensions
      )
      maxItemsPackable = result.maxItemsPackable

      // We'll calculate for the actual allocated quantity below
      packagingEstimate = []
      locationPackagingCost = 0
    }

    // IMPORTANT: Skip locations that have no packages - we can't ship without packaging!
    if (!hasPackages || maxItemsPackable <= 0) {
      console.warn(`Skipping location "${location.locationName}" (ID: ${location.pickupLocationId}) - no packages available for shipping`)
      continue
    }

    // Use the minimum of stock, packaging capacity, and remaining quantity
    const maxFromStock = location.availableStock
    const maxFromPackaging = maxItemsPackable
    const maxFromThisLocation = Math.min(maxFromStock, maxFromPackaging)

    const allocatedQuantity = Math.min(maxFromThisLocation, remainingQuantity)

    if (allocatedQuantity > 0) {
      // If not using backend estimates, calculate packaging for allocated quantity
      if (!useBackendEstimates || !location.packagingEstimate) {
        const packages = location.availablePackages || []
        const result = calculatePackagingFromDimensions(
          allocatedQuantity,
          packages,
          productDimensions
        )
        packagingEstimate = result.packagingEstimate
        locationPackagingCost = result.totalPackagingCost
      }

      // Get shipping cost from selected courier
      const shippingCost = location.selectedCourier?.rate || 0

      allocations.push({
        pickupLocationId: location.pickupLocationId,
        locationName: location.locationName,
        allocatedQuantity,
        availableStock: location.availableStock,
        distanceKm: location.distanceKm,
        addressType: location.addressType,
        streetAddress: location.streetAddress,
        streetAddress2: location.streetAddress2,
        streetAddress3: location.streetAddress3,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode,
        country: location.country,
        nameOnAddress: location.nameOnAddress,
        emailOnAddress: location.emailOnAddress,
        phoneOnAddress: location.phoneOnAddress,
        packagingEstimate,
        totalPackagingCost: locationPackagingCost,
        maxItemsPackable: maxFromPackaging,
        availableCouriers: location.availableCouriers || [],
        selectedCourier: location.selectedCourier,
      })

      totalPackagingCost += locationPackagingCost
      totalShippingCost += shippingCost
      remainingQuantity -= allocatedQuantity
    }
  }

  return {
    success: true,
    allocations,
    totalAllocated: requestedQuantity - remainingQuantity,
    totalAvailable,
    totalPackagingCost,
    totalShippingCost,
    shortfall: 0,
  }
}
