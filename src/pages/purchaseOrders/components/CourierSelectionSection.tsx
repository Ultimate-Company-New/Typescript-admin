import { Box, Chip, Paper, Tooltip } from '@mui/material'

import {
  Info as InfoIcon,
  LocalShipping as ShippingIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
} from '@mui/icons-material'

import { type CourierOption } from '../../../api/shippingApi'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { RadioGroupInput } from '../../../components/form-input'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for CourierSelectionSection component
 *
 * @property {CourierOption[]} couriers - Array of available courier options for selection.
 *   Each courier contains details like name, rate, delivery days, rating, etc.
 * @property {number} [selectedCourierId] - Optional ID of the currently selected courier.
 *   Used to determine which radio button should be checked.
 * @property {onCourierSelect} onCourierSelect - Callback function invoked when a courier is selected.
 *   Receives the selected CourierOption object as parameter.
 */
interface CourierSelectionSectionProps {
  couriers: CourierOption[]
  selectedCourierId?: number
  onCourierSelect: (courier: CourierOption) => void
}

/**
 * Courier Selection Section Component
 *
 * Displays a list of available courier options for a specific pickup location,
 * allowing users to select a courier via radio buttons. Shows detailed information
 * about each courier including price, delivery time, rating, performance metrics,
 * and service type (Surface/Air).
 *
 * Features:
 * - Radio button selection for each courier
 * - Visual star rating display (0-5 stars)
 * - "Cheapest" badge on the first courier (assumed to be sorted by price)
 * - Delivery performance percentage
 * - Real-time tracking availability indicator
 * - Empty state when no couriers are available
 *
 * @param {CourierSelectionSectionProps} props - Component props
 * @returns {JSX.Element} Rendered courier selection section
 */
const CourierSelectionSection = ({
  couriers,
  selectedCourierId,
  onCourierSelect,
}: CourierSelectionSectionProps): JSX.Element => {
  /**
   * Renders a visual star rating representation for a courier's rating.
   *
   * Creates 5 star icons, filling them based on the rating value.
   * Uses floor division to determine how many full stars to show.
   *
   * Algorithm:
   * 1. Calculate full stars using Math.floor(rating) (e.g., 4.7 → 4 stars)
   * 2. Create array of 5 star icons
   * 3. Fill stars up to fullStars count with filled style
   * 4. Remaining stars use empty style
   *
   * Why floor division?
   * - Provides consistent visual representation
   * - Only shows full stars (no half stars)
   * - Simple and clear for users
   *
   * Example:
   * - Rating 4.7 → 4 filled stars, 1 empty star
   * - Rating 2.1 → 2 filled stars, 3 empty stars
   * - Rating 5.0 → 5 filled stars, 0 empty stars
   *
   * @param {number} rating - The courier's rating value (typically 0-5)
   * @returns {JSX.Element} Box containing 5 star icons with appropriate styling
   */
  const renderRating = (rating: number) => {
    /**
     * Calculate number of full stars to display.
     *
     * Uses Math.floor to round down (e.g., 4.7 → 4, 2.1 → 2).
     * This ensures we only show complete stars, not partial ones.
     */
    const fullStars = Math.floor(rating)

    /**
     * Array to hold star icon elements.
     *
     * We build this array dynamically to avoid hardcoding 5 separate JSX elements.
     */
    const stars = []

    /**
     * Generate 5 star icons with appropriate styling.
     *
     * Loop through 5 positions (0-4):
     * - If position < fullStars: Use filled star style (yellow/gold)
     * - Otherwise: Use empty star style (gray/outline)
     *
     * Why use index-based comparison?
     * - Simple and efficient
     * - Clear logic: first N stars are filled, rest are empty
     * - Works for any rating value (0-5)
     */
    for (let i = 0; i < 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          /**
           * Apply filled or empty style based on position.
           *
           * i < fullStars: This star should be filled (e.g., if fullStars=3, positions 0,1,2 are filled)
           * Otherwise: This star should be empty (positions 3,4 are empty)
           */
          className={i < fullStars ? styles['shipping-estimate-modal__star-filled'] : styles['shipping-estimate-modal__star-empty']}
        />
      )
    }

    /**
     * Return container with all star icons.
     *
     * Wrapped in Box for consistent styling and layout.
     */
    return <Box className={styles['shipping-estimate-modal__rating-container']}>{stars}</Box>
  }

  // Early return: Show empty state if no couriers are available
  // This prevents rendering an empty radio group and provides user feedback
  if (couriers.length === 0) {
    return (
      <>
        <Box className={styles['shipping-estimate-modal__section-header']}>
          <ShippingIcon fontSize="small" color="success" />
          <Subheader variant="subtitle2" label="Select Courier" />
        </Box>
        <Paper variant="outlined" className={styles['shipping-estimate-modal__no-couriers-paper']}>
          <InfoIcon color="warning" className={styles['shipping-estimate-modal__no-couriers-icon']} />
          <BodyText variant="body2" className={styles['shipping-estimate-modal__no-couriers-text']}>
            No couriers available for this route
          </BodyText>
        </Paper>
      </>
    )
  }

  return (
    <>
      <Box className={styles['shipping-estimate-modal__section-header']}>
        <ShippingIcon fontSize="small" color="success" />
        <Subheader variant="subtitle2" label="Select Courier" />
      </Box>
      {/*
        RadioGroupInput: Custom radio group component that displays courier options.
        Each option is a rich label containing multiple pieces of information.
      */}
      <RadioGroupInput
        /**
         * Current selected courier ID (controlled component).
         *
         * Uses empty string as fallback when no courier is selected.
         * This ensures RadioGroupInput always has a valid value prop.
         */
        value={selectedCourierId || ''}
        /**
         * Handle courier selection change.
         *
         * When user selects a courier via radio button:
         * 1. Find the full courier object matching the selected ID
         * 2. If found, pass the complete courier object to parent callback
         *
         * Why find courier object instead of just passing ID?
         * - Parent component needs full courier details (name, rate, etc.)
         * - Avoids parent needing to look up courier by ID
         * - Cleaner API: parent receives complete data structure
         *
         * Why check if courier exists?
         * - Defensive programming: handles edge cases
         * - Prevents errors if ID doesn't match any courier
         * - Type safety: ensures we only call callback with valid courier
         */
        onChange={(value) => {
          /**
           * Find courier object matching the selected ID.
           *
           * Uses Array.find() to search for courier with matching courierCompanyId.
           * Returns undefined if no match found (edge case handling).
           */
          const courier = couriers.find(c => c.courierCompanyId === value)

          /**
           * Only call parent callback if courier found.
           *
           * This prevents errors and ensures type safety.
           * Parent receives complete CourierOption object, not just ID.
           */
          if (courier) {
            onCourierSelect(courier)
          }
        }}
        options={couriers.map((courier, index) => ({
          value: courier.courierCompanyId,
          label: (
            <Box className={styles['shipping-estimate-modal__courier-label-container']}>
              {/* Header: Courier name and "Cheapest" badge */}
              <Box className={styles['shipping-estimate-modal__courier-header']}>
                <BodyText variant="body2" className={styles['shipping-estimate-modal__courier-name']}>
                  {courier.courierName}
                </BodyText>
                {/* Show "Cheapest" badge on first courier (assumes couriers are sorted by price ascending) */}
                {index === 0 && (
                  <Chip
                    label="Cheapest"
                    size="small"
                    color="success"
                    className={styles['shipping-estimate-modal__courier-chip']}
                  />
                )}
              </Box>
              {/* Price and delivery time row */}
              <Box className={styles['shipping-estimate-modal__courier-price-row']}>
                <Subheader variant="h6" label={`₹${courier.rate.toLocaleString('en-IN')}`} className={styles['shipping-estimate-modal__courier-price']} />
                <SecondaryFont variant="caption">
                  {courier.estimatedDeliveryDays}
                </SecondaryFont>
              </Box>
              {/* Rating row: Visual stars + numeric rating */}
              <Box className={styles['shipping-estimate-modal__courier-rating-row']}>
                {renderRating(courier.rating ?? 0)}
                <SecondaryFont variant="caption">
                  ({(courier.rating ?? 0).toFixed(1)})
                </SecondaryFont>
              </Box>
              {/* Additional info chips: Performance, type, tracking */}
              <Box className={styles['shipping-estimate-modal__courier-chips']}>
                {/* Delivery Performance: Percentage of successful deliveries */}
                <Tooltip title="Delivery Performance">
                  <Chip
                    icon={<SpeedIcon className={styles['shipping-estimate-modal__speed-icon']} />}
                    label={`D: ${((courier.deliveryPerformance ?? 0) * 100).toFixed(0)}%`}
                    size="small"
                    className={styles['shipping-estimate-modal__courier-chip']}
                  />
                </Tooltip>
                {/* Courier Type: Surface or Air */}
                <Chip
                  label={courier.courierType}
                  size="small"
                  variant="outlined"
                  className={styles['shipping-estimate-modal__courier-chip']}
                />
                {/* Real-time Tracking: Only show if available */}
                {courier.realtimeTracking === 'Yes' && (
                  <Chip
                    label="Tracking"
                    size="small"
                    color="info"
                    className={styles['shipping-estimate-modal__courier-chip']}
                  />
                )}
              </Box>
            </Box>
          ),
        }))}
      />
    </>
  )
}

export default CourierSelectionSection
