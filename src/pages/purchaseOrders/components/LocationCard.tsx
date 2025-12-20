import { Box, Card, CardContent, Chip, Paper } from '@mui/material'

import {
    Email as EmailIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    LocationOn as LocationIcon,
    Inventory as PackageIcon,
    Phone as PhoneIcon,
    Inventory2 as ProductIcon,
} from '@mui/icons-material'

import { type CourierOption } from '../../../api/shippingApi'
import { IconButton } from '../../../components/buttons'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { type EnhancedLocationData } from '../../../models/purchase-order-components/PurchaseOrderComponentModels'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for LocationCard component
 *
 * @property {EnhancedLocationData} location - Complete location data including address,
 *   products, packages, and available couriers for this pickup location.
 * @property {boolean} isExpanded - Whether the card is currently expanded to show details.
 *   Controls the visual state and which icon is displayed (expand/collapse).
 * @property {CourierOption} [selectedCourier] - Optional courier that has been selected
 *   for this location. Displayed in a summary card when provided.
 * @property {onToggleExpand} onToggleExpand - Callback function invoked when user clicks
 *   to expand/collapse the card. Toggles the expanded state.
 * @property {React.ReactNode} children - Content to display when card is expanded.
 *   Typically contains LocationProductsList, LocationPackagesList, and CourierSelectionSection.
 */
interface LocationCardProps {
  location: EnhancedLocationData
  isExpanded: boolean
  selectedCourier?: CourierOption
  onToggleExpand: () => void
  children: React.ReactNode // Expanded details content
}

/**
 * Location Card Component
 *
 * Displays a collapsible card for a pickup location in the shipping estimate modal.
 * Shows location information, quick stats, selected courier summary, and expandable
 * details section.
 *
 * Features:
 * - Clickable header to expand/collapse details
 * - Location name and address display
 * - Contact information (name, email, phone) if available
 * - Quick stats chips (product count, package count, total weight)
 * - Selected courier summary (name, rate, delivery days)
 * - Expand/collapse icon indicator
 * - Expanded state styling (visual feedback)
 *
 * Layout:
 * - Left side: Location info, address, contact, stats
 * - Right side: Selected courier summary + expand button
 * - Bottom (when expanded): Children content (products, packages, courier selection)
 *
 * Use Cases:
 * - Shipping estimate modal (showing locations with shipping options)
 * - Shipping optimization modal (showing optimized shipments)
 *
 * @param {LocationCardProps} props - Component props
 * @returns {JSX.Element} Rendered location card
 */
const LocationCard = ({
  location,
  isExpanded,
  selectedCourier,
  onToggleExpand,
  children,
}: LocationCardProps): JSX.Element => {
  return (
    <Card
      variant="outlined"
      className={`${styles['shipping-estimate-modal__location-card']} ${isExpanded ? styles['shipping-estimate-modal__location-card--expanded'] : ''}`}
    >
      <CardContent className={styles['shipping-estimate-modal__location-card-content']}>
        {/* Location Header */}
        <Box
          className={styles['shipping-estimate-modal__location-header']}
          onClick={onToggleExpand}
        >
          <Box className={styles['shipping-estimate-modal__location-header-left']}>
            <Box className={styles['shipping-estimate-modal__location-name-row']}>
              <LocationIcon color="primary" />
              <Subheader variant="subtitle1" label={location.locationName} className={styles['shipping-estimate-modal__location-name']} />
            </Box>

            {/* Address Line: Format address components, filter out empty values */}
            <BodyText variant="body2" className={styles['shipping-estimate-modal__location-address']}>
              {[location.streetAddress, location.city, location.state, location.postalCode]
                .filter(Boolean) // Remove undefined/null/empty values
                .join(', ') || location.postalCode || 'Address not available'}
            </BodyText>

            {/* Contact Info: Display name, email, and phone if available */}
            <Box className={styles['shipping-estimate-modal__location-contact']}>
              {location.nameOnAddress && (
                <SecondaryFont variant="caption">
                  👤 {location.nameOnAddress}
                </SecondaryFont>
              )}
              {location.emailOnAddress && (
                <SecondaryFont variant="caption" className={styles['shipping-estimate-modal__contact-item']}>
                  <EmailIcon className={styles['shipping-estimate-modal__contact-icon']} /> {location.emailOnAddress}
                </SecondaryFont>
              )}
              {location.phoneOnAddress && (
                <SecondaryFont variant="caption" className={styles['shipping-estimate-modal__contact-item']}>
                  <PhoneIcon className={styles['shipping-estimate-modal__contact-icon']} /> {location.phoneOnAddress}
                </SecondaryFont>
              )}
            </Box>

            {/* Quick Stats: Visual chips showing key metrics at a glance */}
            <Box className={styles['shipping-estimate-modal__quick-stats']}>
              {/* Product count: Shows number of unique products and total units */}
              <Chip
                icon={<ProductIcon />}
                label={`${location.products.length} Product${location.products.length !== 1 ? 's' : ''} (${location.totalQuantity} units)`}
                size="small"
                color="info"
                variant="outlined"
              />
              {/* Package count: Shows number of packages needed */}
              <Chip
                icon={<PackageIcon />}
                label={`${location.packages.length} Package${location.packages.length !== 1 ? 's' : ''}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              {/* Total weight: Shows combined weight of all products at this location */}
              <Chip
                label={`${location.totalWeightKgs.toFixed(1)} kg`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Selected Courier Summary */}
          <Box className={styles['shipping-estimate-modal__selected-courier-container']}>
            {selectedCourier && (
              <Paper className={styles['shipping-estimate-modal__selected-courier-paper']}>
                <SecondaryFont variant="caption" className={styles['shipping-estimate-modal__selected-courier-label']}>
                  Selected Courier
                </SecondaryFont>
                <BodyText className={styles['shipping-estimate-modal__selected-courier-name']}>
                  {selectedCourier.courierName}
                </BodyText>
                <Box className={styles['shipping-estimate-modal__selected-courier-details']}>
                  <BodyText variant="body2" className={styles['shipping-estimate-modal__selected-courier-rate']}>
                    ₹{selectedCourier.rate.toLocaleString('en-IN')}
                  </BodyText>
                  <SecondaryFont variant="caption" className={styles['shipping-estimate-modal__selected-courier-days']}>
                    {selectedCourier.estimatedDeliveryDays}
                  </SecondaryFont>
                </Box>
              </Paper>
            )}
            <IconButton size="small" color="primary">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Expanded Details - passed as children */}
        {children}
      </CardContent>
    </Card>
  )
}

export default LocationCard
