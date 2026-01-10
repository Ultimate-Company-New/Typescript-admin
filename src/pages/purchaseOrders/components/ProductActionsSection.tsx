import { Box, CircularProgress, Tooltip } from '@mui/material'

import { Add as AddIcon, Calculate as CalculateIcon } from '@mui/icons-material'

import { BlueButton } from '../../../components/buttons'
import { SecondaryFont } from '../../../components/fonts'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for ProductActionsSection component
 *
 * @property {boolean} hasValidDeliveryAddress - Whether the delivery address is complete
 *   (has postal code, city, and state). Required for product selection and shipping calculation.
 * @property {boolean} disabled - Whether actions should be disabled (e.g., in view mode or during processing).
 * @property {boolean} shippingCalculated - Whether shipping has already been calculated.
 *   Affects button text ("Calculate Shipping" vs "Recalculate Shipping").
 * @property {boolean} shippingLoading - Whether shipping calculation is currently in progress.
 *   Shows loading spinner and disables button.
 * @property {boolean} canCalculateShipping - Whether shipping calculation is enabled.
 *   Requires products and valid address.
 * @property {onAddProduct} onAddProduct - Callback invoked when "Add Product" button is clicked.
 *   Opens the product picker modal.
 * @property {onCalculateShipping} onCalculateShipping - Callback invoked when shipping calculation
 *   button is clicked. Triggers the shipping optimization API call.
 */
interface ProductActionsSectionProps {
  hasValidDeliveryAddress: boolean
  disabled: boolean
  shippingCalculated: boolean
  shippingLoading: boolean
  canCalculateShipping: boolean
  onAddProduct: () => void
  onCalculateShipping: () => void
}

/**
 * Product Actions Section Component
 *
 * Displays the primary action buttons for managing products in a purchase order:
 * - "Add Product" button (opens product picker)
 * - "Calculate Shipping" button (triggers optimization)
 *
 * Features:
 * - Contextual button states (disabled, loading, outlined vs contained)
 * - Tooltips explaining why buttons are disabled
 * - Loading spinner during shipping calculation
 * - Dynamic button text ("Calculate" vs "Recalculate")
 * - Warning message when address is incomplete
 *
 * Button States:
 * - Add Product: Disabled if form is disabled or address invalid
 * - Calculate Shipping: Disabled if form disabled, loading, or prerequisites not met
 *   (needs products + valid address)
 *
 * Visual Feedback:
 * - Tooltips show reason for disabled state
 * - Loading spinner replaces icon during calculation
 * - Button variant changes (outlined when already calculated)
 * - Warning text below buttons when address incomplete
 *
 * Use Cases:
 * - Product items section (main actions for product management)
 * - Purchase order form (product management actions)
 *
 * @param {ProductActionsSectionProps} props - Component props
 * @returns {JSX.Element} Rendered actions section
 */
const ProductActionsSection = ({
  hasValidDeliveryAddress,
  disabled,
  shippingCalculated,
  shippingLoading,
  canCalculateShipping,
  onAddProduct,
  onCalculateShipping,
}: ProductActionsSectionProps): JSX.Element => {
  return (
    <Box className={styles['product-items-section__actions']}>
      {/* Add Product Button: Opens product picker modal */}
      <Tooltip title={!hasValidDeliveryAddress ? 'Please fill delivery address first' : ''}>
        {/* Wrap in span to enable tooltip on disabled button */}
        <span>
          <BlueButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddProduct}
            disabled={disabled} // Disabled if form is disabled (e.g., view mode)
            label="Add Product"
          />
        </span>
      </Tooltip>

      {/* Calculate Shipping Button: Triggers shipping optimization */}
      <Tooltip title={!canCalculateShipping ? 'Add products first to calculate shipping' : ''}>
        {/* Wrap in span to enable tooltip on disabled button */}
        <span>
          <BlueButton
            variant="outlined" // Always outlined for white background with green border
            color="success"
            startIcon={shippingLoading ? <CircularProgress size={16} color="inherit" /> : <CalculateIcon />}
            onClick={onCalculateShipping}
            disabled={disabled || shippingLoading || !canCalculateShipping} // Disabled if form disabled, loading, or prerequisites not met
            className={styles['product-items-section__calculate-shipping-button']}
          >
            {/* Dynamic text: Show "Calculating..." during load, show calculated state, otherwise "Calculate Shipping" */}
            {shippingLoading ? 'Calculating...' : (shippingCalculated ? 'Shipping Calculated' : 'Calculate Shipping')}
          </BlueButton>
        </span>
      </Tooltip>

      {/* Warning Message: Show when address is incomplete */}
      {!hasValidDeliveryAddress && (
        <SecondaryFont variant="caption" className={styles['product-items-section__warning-text']}>
          Fill delivery address to enable product selection
        </SecondaryFont>
      )}
    </Box>
  )
}

export default ProductActionsSection
