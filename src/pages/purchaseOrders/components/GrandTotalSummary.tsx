import { Divider, Grid, Paper } from '@mui/material'

import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for GrandTotalSummary component
 *
 * @property {Object} grandTotals - Aggregated totals across all products in the order
 *   @property {number} grossSubtotal - Total before any discounts (quantity × original price)
 *   @property {number} subtotal - Total after discounts but before packaging/shipping/tax
 *   @property {number} discount - Total discount amount applied across all products
 *   @property {number} packaging - Total packaging fees (deprecated, use totalPackagingCost instead)
 *   @property {number} shipping - Total shipping fees (deprecated, use totalShippingCost instead)
 *   @property {number} total - Grand total including all fees (deprecated, calculated here)
 * @property {number} totalPackagingCost - Total packaging cost from shipping optimization result.
 *   This comes from the optimization API and represents the actual packaging solution cost.
 * @property {number} totalShippingCost - Total shipping cost from selected couriers.
 *   Sum of all selected courier rates across all pickup locations.
 * @property {boolean} shippingCalculated - Whether shipping has been calculated via optimization.
 *   When false, shows "Calculate shipping" placeholder text instead of costs.
 */
interface GrandTotalSummaryProps {
  grandTotals: {
    grossSubtotal: number
    subtotal: number
    discount: number
    packaging: number
    shipping: number
    total: number
  }
  totalPackagingCost: number
  totalShippingCost: number
  shippingCalculated: boolean
}

/**
 * Grand Total Summary Component
 *
 * Displays a comprehensive order summary showing all financial breakdowns:
 * - Products subtotal (before discount)
 * - Total discount (if any)
 * - Packaging fee (from optimization result)
 * - Shipping cost (from selected couriers)
 * - Subtotal before GST (products + packaging + shipping)
 * - GST amount (18% of subtotal)
 * - Grand total (subtotal + GST)
 *
 * This component provides a clear financial overview of the entire purchase order,
 * helping users understand the cost breakdown before finalizing the order.
 *
 * Calculation flow:
 * 1. Products Subtotal = sum of (quantity × pricePerUnit) before discount
 * 2. Discount = sum of all product discounts
 * 3. Subtotal Before GST = (Products after discount) + Packaging + Shipping
 * 4. GST = Subtotal Before GST × 18%
 * 5. Grand Total = Subtotal Before GST + GST
 *
 * @param {GrandTotalSummaryProps} props - Component props
 * @returns {JSX.Element} Rendered order summary paper
 */
const GrandTotalSummary = ({
  grandTotals,
  totalPackagingCost,
  totalShippingCost,
  shippingCalculated,
}: GrandTotalSummaryProps): JSX.Element => {
  return (
    <Paper className={styles['product-items-section__grand-total-paper']}>
      <Subheader variant="subtitle1" label="🧾 Order Summary" className={styles['product-items-section__grand-total-header']} />
      <Grid container spacing={1}>
        {/* Products Subtotal (before discount) */}
        <Grid item xs={8}>
          <BodyText variant="body2" className={styles['product-items-section__grand-total-label']}>
            Products Subtotal
          </BodyText>
        </Grid>
        <Grid item xs={4}>
          <BodyText variant="body2" className={styles['product-items-section__grand-total-value']}>
            ₹{grandTotals.grossSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </BodyText>
        </Grid>

        {/* Discount - only show when there's a discount */}
        {grandTotals.discount > 0 && (
          <>
            <Grid item xs={8}>
              <BodyText variant="body2" className={styles['product-items-section__price-value-success']}>
                Total Discount
              </BodyText>
            </Grid>
            <Grid item xs={4}>
              <BodyText variant="body2" className={styles['product-items-section__price-value-success']}>
                -₹{grandTotals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </BodyText>
            </Grid>
          </>
        )}

        {/* Packaging Fee - from optimization result */}
        <Grid item xs={8}>
          <BodyText variant="body2" className={styles['product-items-section__grand-total-label']}>
            📦 Packaging Fee
          </BodyText>
        </Grid>
        <Grid item xs={4}>
          <BodyText variant="body2" className={styles['product-items-section__grand-total-value']}>
            {shippingCalculated ? (
              `₹${totalPackagingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            ) : (
              <SecondaryFont component="span" variant="caption" className={styles['product-items-section__info-text']}>
                Calculate shipping
              </SecondaryFont>
            )}
          </BodyText>
        </Grid>

        {/* Shipping */}
        <Grid item xs={8}>
          <BodyText variant="body2" className={styles['product-items-section__grand-total-label']}>
            🚚 Total Shipping
          </BodyText>
        </Grid>
        <Grid item xs={4}>
          <BodyText variant="body2" className={styles['product-items-section__grand-total-value']}>
            {shippingCalculated ? (
              `₹${totalShippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            ) : (
              <SecondaryFont component="span" variant="caption" className={styles['product-items-section__info-text']}>
                Calculate shipping
              </SecondaryFont>
            )}
          </BodyText>
        </Grid>

        <Grid item xs={12}>
          <Divider className={styles['product-items-section__grand-total-divider']} />
        </Grid>

        {/*
          Subtotal before GST calculation:
          This IIFE (Immediately Invoked Function Expression) calculates the final totals
          including GST. We use an IIFE here to keep the calculation logic scoped and
          avoid polluting the component's scope with temporary variables.

          Formula:
          - Subtotal Before GST = Products (after discount) + Packaging + Shipping
          - GST = 18% of Subtotal Before GST (standard Indian GST rate)
          - Grand Total = Subtotal Before GST + GST
        */}
        {(() => {
          // Calculate subtotal before GST: products (already discounted) + packaging + shipping
          const subtotalBeforeGst = grandTotals.subtotal + totalPackagingCost + totalShippingCost
          // Calculate GST: 18% of subtotal (standard Indian tax rate)
          const gstAmount = subtotalBeforeGst * 0.18
          // Grand total: subtotal + GST
          const grandTotal = subtotalBeforeGst + gstAmount

          return (
            <>
              <Grid item xs={8}>
                <BodyText variant="body2" className={styles['product-items-section__grand-total-value-bold']}>
                  Subtotal
                </BodyText>
              </Grid>
              <Grid item xs={4}>
                <BodyText variant="body2" className={styles['product-items-section__grand-total-value-bold']}>
                  ₹{subtotalBeforeGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </BodyText>
              </Grid>

              {/* Tax calculation - 18% GST on subtotal */}
              <Grid item xs={8}>
                <BodyText variant="body2" className={styles['product-items-section__grand-total-label']}>
                  GST (18%)
                </BodyText>
              </Grid>
              <Grid item xs={4}>
                <BodyText variant="body2" className={styles['product-items-section__grand-total-value']}>
                  ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </BodyText>
              </Grid>

              <Grid item xs={12}>
                <Divider className={styles['product-items-section__grand-total-divider-large']} />
              </Grid>

              {/* Grand Total = subtotal + GST */}
              <Grid item xs={8}>
                <Subheader variant="h6" label="Grand Total" className={styles['product-items-section__grand-total-final-label']} />
              </Grid>
              <Grid item xs={4}>
                <Subheader variant="h5" label={`₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} className={styles['product-items-section__grand-total-final-value']} />
              </Grid>
            </>
          )
        })()}
      </Grid>
    </Paper>
  )
}

export default GrandTotalSummary
