import { useCallback, useEffect, useMemo, useState } from 'react'

import { toast } from 'react-toastify'

import {
  Check as CheckIcon,
  Close as CloseIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material'
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
} from '@mui/material'

import { type CourierOption } from '../../../api/shippingApi'
import { BlueButton, IconButton, RedButton } from '../../../components/buttons'
import { BodyText, Subheader } from '../../../components/fonts'
import {
  type EnhancedLocationData,
  type PackageInLocation,
  type ProductInLocation,
  type ProductItemsSectionProps,
  type PurchaseOrderProductItemForm,
  type ShippingEstimateModalProps,
} from '../../../models'
import type { PurchaseOrderProductItem } from '../../../models/api-models'
import styles from '../../../styles/PurchaseOrders.module.scss'

import CourierSelectionSection from './CourierSelectionSection'
import LocationCard from './LocationCard'
import LocationPackagesList from './LocationPackagesList'
import LocationProductsList from './LocationProductsList'

/**
 * Shipping Estimate Modal
 * Displays detailed shipping options for each pickup location
 * Allows selection of courier for each location
 */
const ShippingEstimateModal = ({
  open,
  onClose,
  productItems,
  locationOptions,
  onConfirm,
  isLoading = false,
}: ShippingEstimateModalProps): JSX.Element => {
  // Local state for courier selections
  const [courierSelections, setCourierSelections] = useState<Map<number, CourierOption>>(new Map())
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(null)

  /**
   * Initialize courier selections when location options change.
   *
   * This effect sets up initial courier selections for each location:
   * 1. If location already has a selected courier, use it
   * 2. Otherwise, default to first courier (assumed to be cheapest, sorted by API)
   * 3. If no couriers available, leave unselected
   *
   * Why default to first courier?
   * - API typically returns couriers sorted by price (cheapest first)
   * - Provides a sensible default for users
   * - Users can still change selection if desired
   */
  useEffect(() => {
    const initialSelections = new Map<number, CourierOption>()
    for (const loc of locationOptions) {
      if (loc.selectedCourier) {
        // Use existing selection if available
        initialSelections.set(loc.pickupLocationId, loc.selectedCourier as CourierOption)
      } else if (loc.availableCouriers.length > 0) {
        // Default to cheapest option (first in array, assumed sorted by price)
        initialSelections.set(loc.pickupLocationId, loc.availableCouriers[0] as CourierOption)
      }
    }
    setCourierSelections(initialSelections)
  }, [locationOptions])

  /**
   * Type cast: Convert API product items to form product items.
   *
   * The API uses PurchaseOrderProductItem (simpler structure),
   * but internally we use PurchaseOrderProductItemForm (extended with allocations).
   * This cast allows us to work with the extended structure.
   */
  const formProductItems = productItems as unknown as PurchaseOrderProductItemForm[]

  /**
   * Build enhanced location data with product and package details.
   *
   * This useMemo processes location options and product items to create
   * EnhancedLocationData objects that contain:
   * - Location information (address, contact)
   * - Products allocated to this location
   * - Packages used at this location
   * - Available couriers
   * - Selected courier
   *
   * Process:
   * 1. Iterate through each location option
   * 2. Find all products allocated to this location (via pickupAllocations)
   * 3. Extract product details (including optional fields from original product data)
   * 4. Collect packages used at this location
   * 5. Group packages by packageId (merge products in package)
   * 6. Build EnhancedLocationData object
   *
   * Why enhance the data?
   * - Location options only contain basic location info
   * - We need product and package details for display
   * - This creates a unified data structure for the UI
   *
   * Product Details Enhancement:
   * - Tries to get full product data from original productItems
   * - Extracts optional fields (brand, UPC, model, images, dimensions)
   * - Falls back to form product data if original not found
   *
   * Package Grouping:
   * - Same package type may appear multiple times (different boxes)
   * - We group by packageId and merge product lists
   * - Shows which products are in each package type
   *
   * @returns {EnhancedLocationData[]} Array of enhanced location data objects
   */
  const enhancedLocations: EnhancedLocationData[] = useMemo(() => {
    const result: EnhancedLocationData[] = []

    for (const loc of locationOptions) {
      // Find products at this location
      const productsAtLocation: ProductInLocation[] = []
      const packagesAtLocation: PackageInLocation[] = []
      let locationDetails: NonNullable<PurchaseOrderProductItemForm['pickupAllocations']>[number] | undefined

      /**
       * Process each product to find allocations for this location.
       *
       * For each product, we:
       * 1. Find the original product data (for optional fields like brand, UPC, model)
       * 2. Check if product has allocations to this location
       * 3. Extract product details for display
       * 4. Collect packages used at this location
       */
      for (const product of formProductItems) {
        /**
         * Find the original product item to get full product details.
         *
         * The form product items may not have all optional fields (brand, UPC, model, etc.).
         * We look up the original PurchaseOrderProductItem to get these fields.
         * This ensures we display complete product information.
         */
        const originalProductItem = productItems.find(
          (item): item is PurchaseOrderProductItem =>
            'product' in item && item.product?.productId === product.productId
        )
        const productData = originalProductItem?.product

        // Skip products without allocations
        if (!product.pickupAllocations) continue

        /**
         * Process each allocation for this product.
         *
         * An allocation represents this product being sourced from a specific
         * pickup location. We process allocations that match the current location.
         */
        for (const alloc of product.pickupAllocations) {
          if (alloc.pickupLocationId === loc.pickupLocationId && alloc.allocatedQuantity > 0) {
            /**
             * Get location details from first matching allocation.
             *
             * We use the first allocation to extract address details.
             * All allocations for the same location should have the same address,
             * so we only need to capture it once.
             */
            if (!locationDetails) {
              locationDetails = alloc as unknown as NonNullable<PurchaseOrderProductItemForm['pickupAllocations']>[number]
            }

            /**
             * Get main image URL with fallback chain.
             *
             * 1. Try to find "Main" labeled image in product.images array
             * 2. Fall back to mainImageUrl from original product data
             * 3. Result may be undefined (handled by component)
             */
            const mainImageUrl = product.images?.find(img => img.label === 'Main')?.url || productData?.mainImageUrl

            /**
             * Add product to location's product list.
             *
             * Includes both required fields (from form) and optional fields (from original data).
             * This ensures LocationProductsList can display complete product information.
             */
            productsAtLocation.push({
              productId: product.productId,
              productTitle: product.productTitle,
              quantity: alloc.allocatedQuantity, // Quantity allocated to THIS location
              pricePerUnit: product.pricePerUnit,
              // Optional fields from original product data
              mainImageUrl,
              brand: productData?.brand,
              upc: productData?.upc,
              model: productData?.model,
              weightKgs: productData?.weightKgs,
              dimensions: productData?.breadth && productData?.height && productData?.length ? {
                length: productData.length,
                breadth: productData.breadth,
                height: productData.height,
              } : undefined,
            })

            /**
             * Process packages used at this location.
             *
             * Packages are stored in the allocation's packagingEstimate array.
             * We group packages by packageId to avoid duplicates and merge product lists.
             */
            if (alloc.packagingEstimate) {
              for (const pkg of alloc.packagingEstimate) {
                // Check if this package type already exists in the list
                const existingPkg = packagesAtLocation.find(p => p.packageId === pkg.packageId)
                if (existingPkg) {
                  /**
                   * Package already exists: Add this product to its product list.
                   *
                   * Same package type may be used for multiple products or allocations.
                   * We merge product lists to show all products in this package type.
                   */
                  if (!existingPkg.productsInPackage) {
                    existingPkg.productsInPackage = []
                  }
                  existingPkg.productsInPackage.push({
                    productId: product.productId,
                    productTitle: product.productTitle,
                    quantity: alloc.allocatedQuantity,
                  })
                } else {
                  /**
                   * New package type: Add it to the list with this product.
                   *
                   * Creates a new PackageInLocation entry with the product in its list.
                   */
                  packagesAtLocation.push({
                    packageId: pkg.packageId,
                    packageName: pkg.packageName,
                    packageType: pkg.packageType,
                    quantityUsed: pkg.quantityUsed,
                    pricePerUnit: pkg.pricePerUnit,
                    totalCost: pkg.totalCost,
                    productsInPackage: [{
                      productId: product.productId,
                      productTitle: product.productTitle,
                      quantity: alloc.allocatedQuantity,
                    }],
                  })
                }
              }
            }
          }
        }
      }

      result.push({
        pickupLocationId: loc.pickupLocationId,
        locationName: loc.locationName,
        streetAddress: locationDetails?.streetAddress,
        streetAddress2: locationDetails?.streetAddress2,
        city: locationDetails?.city,
        state: locationDetails?.state,
        postalCode: loc.pickupPostcode || locationDetails?.postalCode,
        country: locationDetails?.country,
        nameOnAddress: locationDetails?.nameOnAddress,
        emailOnAddress: locationDetails?.emailOnAddress,
        phoneOnAddress: locationDetails?.phoneOnAddress,
        totalWeightKgs: loc.totalWeightKgs,
        totalQuantity: loc.totalQuantity,
        products: productsAtLocation,
        packages: packagesAtLocation,
        availableCouriers: loc.availableCouriers,
        selectedCourier: courierSelections.get(loc.pickupLocationId),
      })
    }

    return result
  }, [locationOptions, productItems, courierSelections])

  /**
   * Calculate total shipping cost from all selected couriers.
   *
   * Sums up the rates of all couriers selected across all pickup locations.
   * This gives the total shipping cost for the entire order.
   *
   * @returns {number} Total shipping cost in rupees
   */
  const totalShippingCost = useMemo(() => {
    let total = 0
    for (const [, courier] of courierSelections) {
      total += courier.rate
    }
    return total
  }, [courierSelections])

  /**
   * Handle courier selection for a specific location.
   *
   * Updates the courier selections map with the new selection for the given location.
   * Uses Map for O(1) lookup and update performance.
   *
   * @param {number} locationId - ID of the pickup location
   * @param {CourierOption} courier - The courier option that was selected
   */
  const handleCourierSelect = useCallback((locationId: number, courier: CourierOption) => {
    setCourierSelections(prev => {
      // Create new Map to ensure React detects state change
      const next = new Map(prev)
      next.set(locationId, courier)
      return next
    })
  }, [])

  /**
   * Handle confirmation of shipping selections.
   *
   * This function is called when user clicks "Confirm Shipping" button.
   * It:
   * 1. Converts enhanced locations to shipping allocations format
   * 2. Extracts selected courier information
   * 3. Calls parent's onConfirm callback with allocations and total cost
   * 4. Shows success toast
   * 5. Closes the modal
   *
   * Data Conversion:
   * - EnhancedLocationData -> ShippingAllocation format
   * - Extracts only necessary fields for parent component
   * - Includes selected courier details
   *
   * @returns {void}
   */
  const handleConfirm = useCallback(() => {
    const newAllocations: ProductItemsSectionProps['shippingAllocations'] = enhancedLocations.map(loc => ({
      pickupLocationId: loc.pickupLocationId,
      locationName: loc.locationName,
      postalCode: loc.postalCode || '',
      totalWeightKgs: loc.totalWeightKgs,
      totalQuantity: loc.totalQuantity,
      productIds: loc.products.map(p => p.productId),
      packagingCost: 0,
      selectedCourier: loc.selectedCourier ? {
        courierCompanyId: loc.selectedCourier.courierCompanyId,
        courierName: loc.selectedCourier.courierName,
        courierType: loc.selectedCourier.courierType,
        rate: loc.selectedCourier.rate,
        estimatedDeliveryDays: loc.selectedCourier.estimatedDeliveryDays,
        etd: loc.selectedCourier.etd,
        courierOption: loc.selectedCourier, // Store full CourierOption for metadata
      } : undefined,
    }))

    onConfirm(newAllocations as any, totalShippingCost)
    toast.success(`Shipping confirmed: ₹${totalShippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
    onClose()
  }, [enhancedLocations, totalShippingCost, onConfirm, onClose])

  // Toggle location expansion
  const toggleExpand = useCallback((locationId: number) => {
    setExpandedLocationId(prev => prev === locationId ? null : locationId)
  }, [])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: styles['shipping-estimate-modal__paper'] }}
    >
      <DialogTitle className={styles['shipping-estimate-modal__title']}>
        <Box className={styles['shipping-estimate-modal__title-left']}>
          <ShippingIcon color="primary" />
          <Subheader variant="h6" label="Shipping Estimate" />
          <Chip
            label={`${enhancedLocations.length} Location${enhancedLocations.length !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent className={styles['shipping-estimate-modal__content']}>
        {isLoading ? (
          <Box className={styles['shipping-estimate-modal__loading']}>
            <CircularProgress />
            <BodyText className={styles['shipping-estimate-modal__loading-text']}>
              Loading shipping options...
            </BodyText>
          </Box>
        ) : enhancedLocations.length === 0 ? (
          <Box className={styles['shipping-estimate-modal__empty']}>
            <ShippingIcon className={styles['shipping-estimate-modal__empty-icon']} />
            <BodyText className={styles['shipping-estimate-modal__empty-text']}>
              No shipping options available
            </BodyText>
          </Box>
        ) : (
          <Box className={styles['shipping-estimate-modal__locations-list']}>
            {enhancedLocations.map((location) => {
              const isExpanded = expandedLocationId === location.pickupLocationId
              const selectedCourier = courierSelections.get(location.pickupLocationId)

              return (
                <LocationCard
                  key={location.pickupLocationId}
                  location={location}
                  isExpanded={isExpanded}
                  selectedCourier={selectedCourier}
                  onToggleExpand={() => toggleExpand(location.pickupLocationId)}
                >
                  <Collapse in={isExpanded}>
                    <Box className={styles['shipping-estimate-modal__expanded-details']}>
                      <Grid container spacing={3}>
                        {/* Products Column */}
                        <Grid item xs={12} md={4}>
                          <LocationProductsList products={location.products} />
                        </Grid>

                        {/* Packages Column */}
                        <Grid item xs={12} md={4}>
                          <LocationPackagesList packages={location.packages} />
                        </Grid>

                        {/* Courier Selection Column */}
                        <Grid item xs={12} md={4}>
                          <CourierSelectionSection
                            couriers={location.availableCouriers as CourierOption[]}
                            selectedCourierId={selectedCourier?.courierCompanyId}
                            onCourierSelect={(courier) => handleCourierSelect(location.pickupLocationId, courier as CourierOption)}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </LocationCard>
              )
            })}
          </Box>
        )}
      </DialogContent>

      <Divider />

      {/* Footer with Total and Actions */}
      <DialogActions className={styles['shipping-estimate-modal__footer']}>
        <Box>
          <BodyText variant="body2" className={styles['shipping-estimate-modal__footer-label']}>
            Total Shipping Cost
          </BodyText>
          <Subheader variant="h5" label={`₹${totalShippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} className={styles['shipping-estimate-modal__footer-total']} />
        </Box>
        <Box className={styles['shipping-estimate-modal__footer-actions']}>
          <RedButton onClick={onClose} variant="outlined">
            Cancel
          </RedButton>
          <BlueButton
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={handleConfirm}
            disabled={enhancedLocations.some(loc => !courierSelections.has(loc.pickupLocationId) && loc.availableCouriers.length > 0)}
          >
            Confirm Shipping
          </BlueButton>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default ShippingEstimateModal
