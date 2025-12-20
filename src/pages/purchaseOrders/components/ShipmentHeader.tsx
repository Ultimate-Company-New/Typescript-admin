import { Box, Chip, Paper } from '@mui/material'

import {
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    LocationOn as LocationIcon,
    Inventory as PackageIcon,
    Inventory2 as ProductIcon,
} from '@mui/icons-material'

import { type CourierOption, type OptimizationShipment } from '../../../api/shippingApi'
import { IconButton } from '../../../components/buttons'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for ShipmentHeader component
 *
 * @property {OptimizationShipment} shipment - The shipment data from optimization API.
 *   Contains pickup location, products, packages, couriers, and weights.
 * @property {CourierOption} [selectedCourier] - Optional courier that has been selected
 *   for this shipment. Displayed in summary card when provided.
 * @property {boolean} isExpanded - Whether the shipment card is expanded.
 *   Affects icon display (expand/collapse).
 * @property {boolean} isValid - Whether the shipment is valid (has packages and couriers).
 *   Affects location icon color (primary for valid, error for invalid).
 * @property {string | null} [shipmentLabel] - Optional label for the shipment.
 *   Used to indicate weight-split shipments (e.g., "Shipment 1 of 3").
 * @property {onToggleExpand} onToggleExpand - Callback invoked when header is clicked
 *   to expand/collapse the shipment details.
 */
interface ShipmentHeaderProps {
  shipment: OptimizationShipment
  selectedCourier?: CourierOption
  isExpanded: boolean
  isValid: boolean
  shipmentLabel?: string | null
  onToggleExpand: () => void
}

/**
 * Shipment Header Component
 *
 * Displays the header section of a shipment card in the shipping optimization modal.
 * Shows location information, shipment statistics, status indicators, and selected
 * courier summary.
 *
 * Features:
 * - Location name and address
 * - Status chips (warnings/errors for missing packages or couriers)
 * - Shipment label (for weight-split shipments)
 * - Quick stats (products, boxes, weight, packaging cost)
 * - Selected courier summary
 * - Expand/collapse functionality
 *
 * Status Indicators:
 * - Location icon color: Primary (valid) or Error (invalid)
 * - "No Packages Available" chip: Shown when no packaging solution found
 * - "No Couriers" chip: Shown when packages exist but no couriers available
 * - Shipment label chip: Shows "Shipment X of Y" for weight-split shipments
 *
 * Calculations:
 * - Total Boxes: Sums quantityUsed from all packagesUsed
 * - Packaging Cost: Sums totalCost from all packagesUsed
 *
 * Visual States:
 * - Valid: Green location icon, normal styling
 * - Invalid: Red location icon, error chips, reduced opacity
 * - Expanded: Shows collapse icon
 * - Collapsed: Shows expand icon
 *
 * Use Cases:
 * - Shipping optimization modal (shipment headers)
 * - Shipping estimate modal (location headers)
 *
 * @param {ShipmentHeaderProps} props - Component props
 * @returns {JSX.Element} Rendered shipment header
 */
const ShipmentHeader = ({
  shipment,
  selectedCourier,
  isExpanded,
  isValid,
  shipmentLabel,
  onToggleExpand,
}: ShipmentHeaderProps): JSX.Element => {
  // Extract location name with fallback
  const locationName = shipment.pickupLocation?.addressNickName || 'Unknown Location'

  // Extract address for formatting
  const address = shipment.pickupLocation?.address

  /**
   * Format address line from address components.
   * Filters out empty values and joins with commas.
   */
  const addressLine = address
    ? [address.streetAddress, address.city, address.state, address.postalCode].filter(Boolean).join(', ')
    : 'Address not available'

  // Check if couriers are available for this shipment
  const hasCouriersAvailable = shipment.availableCouriers.length > 0

  /**
   * Calculate total number of boxes across all packages.
   * Sums up quantityUsed from all packagesUsed in the shipment.
   */
  const totalBoxes = shipment.packagesUsed.reduce((sum, p) => sum + p.quantityUsed, 0)

  // Determine if packages are available (packaging solution exists)
  const hasPackages = totalBoxes > 0

  return (
    <Box
      className={styles['shipping-optimization-modal__shipment-header']}
      onClick={onToggleExpand}
    >
      <Box className={styles['shipping-optimization-modal__shipment-header-left']}>
        <Box className={styles['shipping-optimization-modal__shipment-title-row']}>
          <LocationIcon color={isValid ? 'primary' : 'error'} />
          <Subheader variant="subtitle1" label={locationName} className={styles['shipping-optimization-modal__shipment-location-name']} />
          {shipmentLabel && (
            <Chip
              label={shipmentLabel}
              size="small"
              color="info"
              variant="outlined"
              className={styles['shipping-optimization-modal__shipment-label-chip']}
            />
          )}
          {!hasPackages && (
            <Chip
              label="⚠️ No Packages Available"
              size="small"
              color="error"
              className={styles['shipping-optimization-modal__shipment-warning-chip']}
            />
          )}
          {!hasCouriersAvailable && hasPackages && (
            <Chip
              label="No Couriers"
              size="small"
              color="error"
              className={styles['shipping-optimization-modal__shipment-error-chip']}
            />
          )}
        </Box>
        <SecondaryFont variant="body2" className={styles['shipping-optimization-modal__shipment-address']}>
          {addressLine}
        </SecondaryFont>
        <Box className={styles['shipping-optimization-modal__shipment-chips-row']}>
          <Chip
            icon={<ProductIcon />}
            label={`${shipment.products.length} Product${shipment.products.length !== 1 ? 's' : ''} (${shipment.totalQuantity} units)`}
            size="small"
            color="info"
            variant="outlined"
          />
          {hasPackages ? (
            <>
              <Chip
                icon={<PackageIcon />}
                label={`${totalBoxes} Boxes`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              <Chip label={`${shipment.totalWeightKgs.toFixed(1)} kg`} size="small" variant="outlined" />
              <Chip
                label={`📦 ₹${shipment.packagesUsed.reduce((sum, p) => sum + p.totalCost, 0).toLocaleString('en-IN')}`}
                size="small"
                className={styles['shipping-optimization-modal__shipment-package-cost-chip']}
              />
            </>
          ) : (
            <Chip
              label="No packaging solution available for these products"
              size="small"
              color="error"
              variant="outlined"
              className={styles['shipping-optimization-modal__shipment-no-packages-chip']}
            />
          )}
        </Box>
      </Box>

      {/* Selected Courier Summary */}
      <Box className={styles['shipping-optimization-modal__shipment-selected-courier-container']}>
        {selectedCourier && (
          <Paper className={styles['shipping-optimization-modal__shipment-selected-courier-paper']}>
            <SecondaryFont variant="caption" className={styles['shipping-optimization-modal__shipment-selected-courier-label']}>
              Selected Courier
            </SecondaryFont>
            <BodyText variant="body2" className={styles['shipping-optimization-modal__shipment-selected-courier-name']}>
              {selectedCourier.courierName}
            </BodyText>
            <BodyText variant="body2" className={styles['shipping-optimization-modal__shipment-selected-courier-price']}>
              ₹{selectedCourier.rate.toLocaleString('en-IN')}
            </BodyText>
          </Paper>
        )}
        <IconButton size="small" color="primary">
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
    </Box>
  )
}

export default ShipmentHeader
