import { useState } from 'react'
import { Box, Chip, Collapse, Divider, Grid, IconButton, Paper, Tooltip } from '@mui/material'

import {
    CalendarToday as CalendarIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    LocalShipping as CourierIcon,
    LocationOn as LocationIcon,
    Inventory as PackageIcon,
    AccountBalanceWallet as PriceIcon,
    Info as InfoIcon
} from '@mui/icons-material'

import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { type ProductItemsSectionProps, type PurchaseOrderProductItemForm } from '../../../models'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for ProductDetailsExpanded component
 *
 * @property {PurchaseOrderProductItemForm} item - The product item to display details for.
 *   Contains product info, pickup allocations, packaging estimates, and financial data.
 * @property {ProductItemsSectionProps['shippingAllocations']} shippingAllocations - Shipping allocations
 *   with courier information for each pickup location.
 */
interface ProductDetailsExpandedProps {
  item: PurchaseOrderProductItemForm
  shippingAllocations?: ProductItemsSectionProps['shippingAllocations']
  isView?: boolean
}

/**
 * Product Details Expanded Component
 *
 * Displays detailed information about a product when its card is expanded in the
 * product items list. Shows two main sections:
 * 1. Pickup Locations & Allocations (left side)
 * 2. Price Breakdown (right side)
 *
 * Features:
 * - Compact card design with all essential info visible
 * - Expandable courier metadata section
 * - Responsive grid layout
 * - Package type indicators
 * - Financial calculations with proper formatting
 *
 * @param {ProductDetailsExpandedProps} props - Component props
 * @returns {JSX.Element} Rendered expanded details
 */
const ProductDetailsExpanded = ({ item, shippingAllocations = [], isView = false }: ProductDetailsExpandedProps): JSX.Element => {
  // Track which allocation cards have expanded courier metadata
  // Uses a unique key (index-based) to handle multiple allocations from the same location
  const [expandedCardKeys, setExpandedCardKeys] = useState<Set<string>>(new Set())

  /**
   * Toggle courier metadata expansion for a specific allocation card
   * Uses a unique key to handle weight-split shipments from the same location
   */
  const toggleCourierExpand = (cardKey: string) => {
    setExpandedCardKeys(prev => {
      const next = new Set(prev)
      if (next.has(cardKey)) {
        next.delete(cardKey)
      } else {
        next.add(cardKey)
      }
      return next
    })
  }

  /**
   * Helper function to find shipping allocation (courier info) for a pickup location
   * Handles cases where there might be multiple shipments from the same location (weight splits)
   * Also checks if the allocation itself has courier info (for edit mode where courier is embedded)
   */
  const getShippingInfo = (pickupLocationId: number, alloc?: any) => {
    // First check if the allocation itself has courier info (edit mode)
    if (alloc?.selectedCourier) {
      return { selectedCourier: alloc.selectedCourier }
    }
    // Otherwise, look up from shippingAllocations (add mode after shipping calculation)
    const match = shippingAllocations.find((sa) => sa.pickupLocationId === pickupLocationId)
    return match
  }

  /**
   * Format address as a single compact line
   */
  const formatCompactAddress = (alloc: NonNullable<PurchaseOrderProductItemForm['pickupAllocations']>[number]) => {
    const addressParts = [
      alloc.streetAddress,
      alloc.city,
      alloc.state,
      alloc.postalCode,
      alloc.country
    ].filter(Boolean)
    return addressParts.join(', ')
  }

  return (
    <Box className={styles['product-items-section__expanded-details']}>
      <Grid container spacing={3} alignItems="flex-start">
        {/* Pickup Locations & Allocations */}
        <Grid item xs={12} md={7}>
          {!isView && (
            <Box className={styles['product-items-section__section-header-with-icon']}>
              <LocationIcon fontSize="small" />
              <Subheader variant="subtitle2" label="Pickup Locations & Shipping" />
            </Box>
          )}
          {!isView && (!item.pickupAllocations || item.pickupAllocations.length === 0) && (
            <SecondaryFont variant="caption" className={styles['product-items-section__empty-allocation-text']}>
              Click on Calculate Shipping to view pickup locations and shipping options.
            </SecondaryFont>
          )}
          <Box className={styles['product-items-section__allocation-list']} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {item.pickupAllocations?.map((alloc, allocIndex) => {
              const shippingInfo = getShippingInfo(alloc.pickupLocationId, alloc)
              const compactAddress = formatCompactAddress(alloc)
              const hasCourierInfo = shippingInfo?.selectedCourier != null

              // DEBUG: Log each allocation
              console.log(`🚚 Allocation ${allocIndex} DEBUG:`, {
                pickupLocationId: alloc.pickupLocationId,
                locationName: alloc.locationName,
                allocatedQuantity: alloc.allocatedQuantity,
                allocSelectedCourier: (alloc as any).selectedCourier,
                shippingInfo: shippingInfo,
                hasCourierInfo: hasCourierInfo,
                courier: shippingInfo?.selectedCourier,
              })
              // Use a unique key combining locationId and index to handle weight splits
              const cardKey = `${alloc.pickupLocationId}-${allocIndex}`
              const isExpanded = expandedCardKeys.has(cardKey)
              const courier = shippingInfo?.selectedCourier

              // Get unique package types
              const packageTypes = alloc.packagingEstimate
                ?.map((pkg) => pkg.packageType)
                .filter((type, index, arr) => arr.indexOf(type) === index) || []

              return (
                <Paper
                  key={cardKey}
                  variant="outlined"
                  sx={{
                    padding: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.01)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  {/* Header Row: Location Name + Units + Package Type */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      <BodyText sx={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {alloc.locationName}
                      </BodyText>
                      <Chip
                        label={`${alloc.allocatedQuantity} units`}
                        size="small"
                        color="primary"
                        sx={{ height: 22, fontSize: '0.75rem' }}
                      />
                      {packageTypes.length > 0 && (
                        <Chip
                          icon={<PackageIcon sx={{ fontSize: '0.9rem !important' }} />}
                          label={packageTypes.join(', ')}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem', color: 'text.secondary' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Address Row */}
                  <SecondaryFont variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontSize: '0.75rem' }}>
                    {compactAddress}
                  </SecondaryFont>

                  {/* Courier Info Row */}
                  {hasCourierInfo && courier ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(25, 118, 210, 0.06)',
                        borderRadius: 1.5,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        }
                      }}
                      onClick={() => toggleCourierExpand(cardKey)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        {/* Courier Name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CourierIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                          <BodyText sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {courier.courierName}
                            {courier.courierType && (
                              <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.5)', marginLeft: 4 }}>
                                ({courier.courierType})
                              </span>
                            )}
                          </BodyText>
                        </Box>

                        {/* ETD */}
                        {(courier.etd || courier.estimatedDeliveryDays) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                            <SecondaryFont variant="caption" sx={{ fontSize: '0.75rem' }}>
                              {courier.etd || `${courier.estimatedDeliveryDays} days`}
                            </SecondaryFont>
                          </Box>
                        )}

                        {/* Rate */}
                        {courier.rate != null && (
                          <Chip
                            label={`₹${courier.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>

                      {/* Expand/Collapse Icon */}
                      <Tooltip title={isExpanded ? 'Hide details' : 'Show courier details'}>
                        <IconButton size="small" sx={{ padding: 0.25 }}>
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : shippingInfo ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: 'rgba(211, 47, 47, 0.06)',
                        borderRadius: 1.5,
                        padding: '6px 10px',
                      }}
                    >
                      <InfoIcon sx={{ fontSize: '0.9rem', color: 'error.main' }} />
                      <SecondaryFont variant="caption" sx={{ color: 'error.main', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        No couriers available for this location
                      </SecondaryFont>
                    </Box>
                  ) : null}

                  {/* Expandable Courier Metadata */}
                  {hasCourierInfo && courier && (
                    <Collapse in={isExpanded}>
                      <Box
                        sx={{
                          mt: 1,
                          pt: 1,
                          borderTop: '1px dashed rgba(0,0,0,0.1)',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: 1,
                        }}
                      >
                        {/* Courier Company ID */}
                        <Box>
                          <SecondaryFont variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                            Courier ID
                          </SecondaryFont>
                          <BodyText sx={{ fontSize: '0.8rem' }}>
                            {courier.courierCompanyId}
                          </BodyText>
                        </Box>

                        {/* Estimated Delivery Days */}
                        {courier.estimatedDeliveryDays && (
                          <Box>
                            <SecondaryFont variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                              Delivery Days
                            </SecondaryFont>
                            <BodyText sx={{ fontSize: '0.8rem' }}>
                              {courier.estimatedDeliveryDays}
                            </BodyText>
                          </Box>
                        )}

                        {/* ETD */}
                        {courier.etd && (
                          <Box>
                            <SecondaryFont variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                              Expected Delivery
                            </SecondaryFont>
                            <BodyText sx={{ fontSize: '0.8rem' }}>
                              {courier.etd}
                            </BodyText>
                          </Box>
                        )}

                        {/* Rate */}
                        <Box>
                          <SecondaryFont variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                            Shipping Rate
                          </SecondaryFont>
                          <BodyText sx={{ fontSize: '0.8rem', color: 'success.main', fontWeight: 600 }}>
                            ₹{courier.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </BodyText>
                        </Box>

                        {/* Full CourierOption metadata if available */}
                        {(courier as any).courierOption && (
                          <>
                            {(courier as any).courierOption.minWeight != null && (
                              <Box>
                                <SecondaryFont variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                                  Min Weight
                                </SecondaryFont>
                                <BodyText sx={{ fontSize: '0.8rem' }}>
                                  {(courier as any).courierOption.minWeight} kg
                                </BodyText>
                              </Box>
                            )}
                            {(courier as any).courierOption.codCharges != null && (courier as any).courierOption.codCharges > 0 && (
                              <Box>
                                <SecondaryFont variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                                  COD Charges
                                </SecondaryFont>
                                <BodyText sx={{ fontSize: '0.8rem' }}>
                                  ₹{(courier as any).courierOption.codCharges?.toLocaleString('en-IN')}
                                </BodyText>
                              </Box>
                            )}
                            {(courier as any).courierOption.mode && (
                              <Box>
                                <SecondaryFont variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                                  Mode
                                </SecondaryFont>
                                <BodyText sx={{ fontSize: '0.8rem' }}>
                                  {(courier as any).courierOption.mode}
                                </BodyText>
                              </Box>
                            )}
                          </>
                        )}
                      </Box>
                    </Collapse>
                  )}
                </Paper>
              )
            })}
          </Box>
        </Grid>

        {/* Price Breakdown */}
        <Grid item xs={12} md={5}>
          <Box className={styles['product-items-section__section-header-with-icon']}>
            <PriceIcon fontSize="small" />
            <Subheader variant="subtitle2" label="Price Breakdown" />
          </Box>
          <Paper variant="outlined" className={styles['product-items-section__price-breakdown']}>
            <Grid container spacing={1}>
              {/**
               * Price Calculation IIFE (Immediately Invoked Function Expression)
               *
               * This IIFE calculates the price breakdown for display.
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
                    originalPrice = item.pricePerUnit / (1 - discountValue / 100)
                    discountAmount = item.quantity * originalPrice * discountValue / 100
                  } else {
                    // Fixed discount: pricePerUnit is discounted, add discount back to get original
                    originalPrice = item.pricePerUnit + discountValue
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
                      <BodyText
                        variant="body2"
                        className={`${styles['product-items-section__price-value']} ${styles['product-items-section__price-value--blue']}`}
                      >
                        ₹{grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </BodyText>
                    </Grid>

                    {hasDiscount && (
                      <>
                        <Grid item xs={7}>
                          <BodyText
                            variant="body2"
                            className={`${styles['product-items-section__price-discount-label']} ${styles['product-items-section__price-discount-label--red']}`}
                          >
                            Discount {item.isDiscountPercent ? `(${discountValue}%)` : `(₹${discountValue.toLocaleString('en-IN')}/unit)`}
                          </BodyText>
                        </Grid>
                        <Grid item xs={5}>
                          <BodyText
                            variant="body2"
                            className={`${styles['product-items-section__price-value-discount']} ${styles['product-items-section__price-value-discount--red']}`}
                          >
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
                      <BodyText
                        variant="body2"
                        className={`${styles['product-items-section__price-value-subtotal']} ${styles['product-items-section__price-value-subtotal--orange']}`}
                      >
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
                <Subheader
                  variant="subtitle2"
                  label={`₹${(item.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  className={`${styles['product-items-section__price-total-value']} ${styles['product-items-section__price-total-value--green']}`}
                  color={undefined}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProductDetailsExpanded
