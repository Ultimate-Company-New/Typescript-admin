import { Box, Chip, Divider, Grid, Paper } from '@mui/material'

import { LocationOn as LocationIcon, Inventory as PackageIcon } from '@mui/icons-material'

import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { type PurchaseOrderProductItemForm } from '../../../models'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for ProductDetailsExpanded component
 *
 * @property {PurchaseOrderProductItemForm} item - The product item to display details for.
 *   Contains product info, pickup allocations, packaging estimates, and financial data.
 */
interface ProductDetailsExpandedProps {
  item: PurchaseOrderProductItemForm
}

/**
 * Product Details Expanded Component
 *
 * Displays detailed information about a product when its card is expanded in the
 * product items list. Shows two main sections:
 * 1. Pickup Locations & Allocations (left side)
 * 2. Price Breakdown (right side)
 *
 * Pickup Locations Section:
 * - Lists all pickup locations where this product is allocated
 * - Shows allocated quantity per location
 * - Displays packages used at each location
 * - Shows packaging cost per location
 * - Address information for each location
 *
 * Price Breakdown Section:
 * - Product price calculation (quantity × unit price)
 * - Discount calculation (percentage or fixed)
 * - Subtotal after discount
 * - Grand total (includes all fees)
 *
 * Features:
 * - Responsive grid layout (7/5 split on desktop, stacked on mobile)
 * - Detailed allocation information
 * - Package visualization
 * - Financial calculations with proper formatting
 * - Empty state handling (no allocations)
 *
 * Calculation Logic:
 * - Reverse-calculates original price for percentage discounts
 * - Shows gross total (before discount)
 * - Shows discount amount
 * - Shows net subtotal (after discount)
 * - Grand total includes all fees (calculated at order level)
 *
 * Use Cases:
 * - Product items section (expanded product details)
 * - Purchase order form (detailed product view)
 *
 * @param {ProductDetailsExpandedProps} props - Component props
 * @returns {JSX.Element} Rendered expanded details
 */
const ProductDetailsExpanded = ({ item }: ProductDetailsExpandedProps): JSX.Element => {
  return (
    <Box className={styles['product-items-section__expanded-details']}>
      <Grid container spacing={3}>
        {/* Pickup Locations & Allocations */}
        <Grid item xs={12} md={7}>
          <Box className={styles['product-items-section__section-header-with-icon']}>
            <LocationIcon fontSize="small" />
            <Subheader variant="subtitle2" label="Pickup Locations & Shipping" />
          </Box>
          <Box className={styles['product-items-section__allocation-list']}>
            {item.pickupAllocations?.map((alloc) => (
              <Paper
                key={alloc.pickupLocationId}
                variant="outlined"
                className={styles['product-items-section__allocation-paper']}
              >
                <Box className={styles['product-items-section__allocation-header']}>
                  <Box>
                    <BodyText className={styles['product-items-section__allocation-location-name']}>
                      {alloc.locationName}
                    </BodyText>
                    <SecondaryFont variant="caption" className={styles['product-items-section__allocation-address']}>
                      {[alloc.city, alloc.state, alloc.postalCode].filter(Boolean).join(', ')}
                    </SecondaryFont>
                  </Box>
                  <Chip
                    label={`${alloc.allocatedQuantity} units`}
                    size="small"
                    color="primary"
                  />
                </Box>

                {/* Packages at this location */}
                {alloc.packagingEstimate && alloc.packagingEstimate.length > 0 && (
                  <Box className={styles['product-items-section__packages-section']}>
                    <SecondaryFont variant="caption" className={styles['product-items-section__packages-label']}>
                      <PackageIcon className={styles['product-items-section__packages-icon']} /> Packages:
                    </SecondaryFont>
                    <Box className={styles['product-items-section__packages-chips']}>
                      {alloc.packagingEstimate.map((pkg) => (
                        <Chip
                          key={pkg.packageId}
                          label={`${pkg.quantityUsed}× ${pkg.packageName}`}
                          size="small"
                          variant="outlined"
                          className={styles['product-items-section__package-chip']}
                        />
                      ))}
                    </Box>
                    <SecondaryFont variant="caption" className={styles['product-items-section__packaging-cost']}>
                      Packaging: ₹{(alloc.totalPackagingCost || 0).toLocaleString('en-IN')}
                    </SecondaryFont>
                  </Box>
                )}

                {/* Note: Shipping is calculated at order level */}
              </Paper>
            ))}
          </Box>
        </Grid>

        {/* Price Breakdown */}
        <Grid item xs={12} md={5}>
          <Subheader variant="subtitle2" label="💰 Price Breakdown" className={styles['product-items-section__section-header']} />
          <Paper variant="outlined" className={styles['product-items-section__price-breakdown']}>
            <Grid container spacing={1}>
              {/**
               * Price Calculation IIFE (Immediately Invoked Function Expression)
               *
               * This IIFE calculates the price breakdown for display. We use an IIFE to:
               * - Keep calculation logic scoped (avoid polluting component scope)
               * - Perform complex calculations inline
               * - Return JSX directly from calculation
               *
               * Calculation Steps:
               * 1. Determine discount type and value
               * 2. Reverse-calculate original price if percentage discount
               * 3. Calculate discount amount
               * 4. Calculate gross total (before discount)
               * 5. Calculate net total (after discount)
               *
               * Why reverse-calculate for percentage discounts?
               * - The form stores pricePerUnit as the discounted price
               * - To show "original price" in breakdown, we need to reverse-calculate
               * - Formula: originalPrice = discountedPrice / (1 - discountPercent/100)
               */}
              {(() => {
                // Extract discount value (default to 0 if not set)
                const discountValue = item.discount ?? 0
                const hasDiscount = discountValue > 0
                let originalPrice = item.pricePerUnit
                let discountAmount = 0

                if (hasDiscount) {
                  if (item.isDiscountPercent) {
                    // Percentage discount: pricePerUnit is already discounted
                    // Reverse-calculate original price: original = pricePerUnit / (1 - discount/100)
                    originalPrice = item.pricePerUnit / (1 - discountValue / 100)
                    // Calculate discount amount: quantity × originalPrice × discountPercent/100
                    discountAmount = item.quantity * originalPrice * discountValue / 100
                  } else {
                    // Fixed discount: pricePerUnit is discounted, add discount back to get original
                    originalPrice = item.pricePerUnit + discountValue
                    // Calculate discount amount: quantity × discountPerUnit
                    discountAmount = item.quantity * discountValue
                  }
                }

                // Calculate totals
                const grossTotal = item.quantity * originalPrice // Total before discount
                const netTotal = grossTotal - discountAmount // Total after discount

                return (
                  <>
                    <Grid item xs={7}>
                      <BodyText variant="body2" className={styles['product-items-section__price-label']}>
                        Product ({item.quantity} × ₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                      </BodyText>
                    </Grid>
                    <Grid item xs={5}>
                      <BodyText variant="body2" className={styles['product-items-section__price-value']}>
                        ₹{grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </BodyText>
                    </Grid>

                    {hasDiscount && (
                      <>
                        <Grid item xs={7}>
                          <BodyText variant="body2" className={styles['product-items-section__price-value-success']}>
                            Discount {item.isDiscountPercent ? `(${discountValue}%)` : `(₹${discountValue.toLocaleString('en-IN')}/unit)`}
                          </BodyText>
                        </Grid>
                        <Grid item xs={5}>
                          <BodyText variant="body2" className={styles['product-items-section__price-value-success']}>
                            -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </BodyText>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}>
                      <Divider className={styles['product-items-section__price-divider']} />
                    </Grid>

                    <Grid item xs={7}>
                      <BodyText variant="body2" className={styles['product-items-section__price-label']}>
                        Subtotal
                      </BodyText>
                    </Grid>
                    <Grid item xs={5}>
                      <BodyText variant="body2" className={styles['product-items-section__price-value']}>
                        ₹{netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </BodyText>
                    </Grid>
                  </>
                )
              })()}

              <Grid item xs={12}>
                <Divider className={styles['product-items-section__price-divider']} />
              </Grid>

              <Grid item xs={7}>
                <Subheader variant="subtitle2" label="Total" className={styles['product-items-section__price-total-label']} />
              </Grid>
              <Grid item xs={5}>
                <Subheader variant="subtitle2" label={`₹${(item.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} className={styles['product-items-section__price-total-value']} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProductDetailsExpanded
