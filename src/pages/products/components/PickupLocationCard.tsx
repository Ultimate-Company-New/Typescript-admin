import EmailIcon from '@mui/icons-material/Email'
import InventoryIcon from '@mui/icons-material/Inventory'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Box, Card, CardContent, Chip, Divider, Tooltip } from '@mui/material'

import { BodyText, SecondaryFont } from '../../../components/fonts'
import styles from '../../../styles/Products.module.scss'

/**
 * Pickup location data structure supporting multiple API response formats
 * Extended to support package inventory fields (reorderLevel, maxStockLevel, lastRestockDate)
 */
export interface PickupLocationCardData {
  // API structure: ProductPickupLocationItem
  pickupLocation?: {
    pickupLocationId: number
    addressNickName?: string
    address?: {
      nameOnAddress?: string
      streetAddress?: string
      streetAddress2?: string
      streetAddress3?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string
      phoneOnAddress?: string
      emailOnAddress?: string
    }
  }
  availableStock?: number

  // Package-specific inventory fields (from PackagePickupLocationMapping)
  /** When to reorder packages - alert threshold (only for packages) */
  reorderLevel?: number
  /** Maximum stock level to maintain (only for packages) */
  maxStockLevel?: number
  /** When packages were last restocked (only for packages) */
  lastRestockDate?: string

  // Legacy flat structure support
  pickupLocationId?: number
  locationName?: string
  addressNickName?: string
  address?: {
    nameOnAddress?: string
    streetAddress?: string
    streetAddress2?: string
    streetAddress3?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    phoneOnAddress?: string
    emailOnAddress?: string
  }
  nameOnAddress?: string
  streetAddress?: string
  streetAddress2?: string
  streetAddress3?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phoneOnAddress?: string
  emailOnAddress?: string
  contactPhone?: string
  contactEmail?: string
}

interface PickupLocationCardProps {
  location: PickupLocationCardData
  index?: number
}

/**
 * Formats a date string to a readable format
 */
const formatRestockDate = (dateStr: string | undefined): string | null => {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

/**
 * Reusable card component to display pickup location details
 * Used in PickupLocationsModal and ProductDetailsView
 * Supports package-specific inventory fields (reorderLevel, maxStockLevel, lastRestockDate)
 */
const PickupLocationCard = ({ location: item, index = 0 }: PickupLocationCardProps): JSX.Element => {
  // Extract data from ProductPickupLocationItem structure
  const location = item.pickupLocation ?? item
  const { availableStock, reorderLevel, maxStockLevel, lastRestockDate } = item
  const locationId = location.pickupLocationId ?? item.pickupLocationId
  const locationName =
    location.addressNickName ?? item.addressNickName ?? item.locationName ?? `Location ${index + 1}`

  // Get address fields from nested address object or directly from location
  const address = location.address ?? item.address
  const nameOnAddress = address?.nameOnAddress ?? item.nameOnAddress
  const streetAddress = address?.streetAddress ?? item.streetAddress
  const streetAddress2 = address?.streetAddress2 ?? item.streetAddress2
  const streetAddress3 = address?.streetAddress3 ?? item.streetAddress3
  const city = address?.city ?? item.city
  const state = address?.state ?? item.state
  const postalCode = address?.postalCode ?? item.postalCode
  const country = address?.country ?? item.country
  const phoneOnAddress = address?.phoneOnAddress ?? item.phoneOnAddress ?? item.contactPhone
  const emailOnAddress = address?.emailOnAddress ?? item.emailOnAddress ?? item.contactEmail

  // Check if any address field exists
  const hasAddress =
    nameOnAddress != null ||
    streetAddress != null ||
    streetAddress2 != null ||
    streetAddress3 != null ||
    city != null ||
    state != null ||
    postalCode != null ||
    country != null

  // Package-specific inventory fields - only show if they exist (not for products)
  const hasPackageInventoryFields = reorderLevel != null || maxStockLevel != null || lastRestockDate != null
  const formattedRestockDate = formatRestockDate(lastRestockDate)

  // Check if stock is below reorder level (warning state)
  const isLowStock = availableStock != null && reorderLevel != null && availableStock <= reorderLevel
  const stockPercentage = availableStock != null && maxStockLevel != null && maxStockLevel > 0
    ? Math.round((availableStock / maxStockLevel) * 100)
    : null

  return (
    <Card
      variant="outlined"
      className={styles['pickup-location-card']}
      key={locationId ?? index}
      data-test-id={`pickup-location-card-${locationId ?? index}`}
    >
      <CardContent>
        {/* Location Name */}
        <Box className={styles['pickup-location-card__header']}>
          <LocationOnIcon color="primary" fontSize="small" />
          <BodyText className={styles['pickup-location-card__title']}>
            {locationName}
          </BodyText>
        </Box>

        {/* Available Stock */}
        {availableStock != null && (
          <Box className={styles['pickup-location-card__stock']}>
            <Chip
              label={`Available Stock: ${availableStock}`}
              size="small"
              color={availableStock > 0 ? (isLowStock ? 'warning' : 'success') : 'error'}
              className={styles['pickup-location-card__stock-chip']}
            />
            {isLowStock && availableStock > 0 && (
              <Tooltip title="Stock is at or below reorder level">
                <WarningAmberIcon
                  color="warning"
                  fontSize="small"
                  className={styles['pickup-location-card__warning-icon']}
                />
              </Tooltip>
            )}
          </Box>
        )}

        {/* Package Inventory Details - Only shown if fields exist (packages only) */}
        {hasPackageInventoryFields && (
          <>
            <Divider className={styles['pickup-location-card__divider']} />
            <Box className={styles['pickup-location-card__inventory']}>
              <SecondaryFont className={styles['pickup-location-card__inventory-title']}>
                <InventoryIcon fontSize="small" className={styles['pickup-location-card__inventory-icon']} />
                Inventory Settings
              </SecondaryFont>

              <Box className={styles['pickup-location-card__inventory-grid']}>
                {reorderLevel != null && (
                  <Box className={styles['pickup-location-card__inventory-item']}>
                    <SecondaryFont className={styles['pickup-location-card__inventory-label']}>
                      Reorder Level
                    </SecondaryFont>
                    <BodyText className={styles['pickup-location-card__inventory-value']}>
                      {reorderLevel}
                    </BodyText>
                  </Box>
                )}

                {maxStockLevel != null && (
                  <Box className={styles['pickup-location-card__inventory-item']}>
                    <SecondaryFont className={styles['pickup-location-card__inventory-label']}>
                      Max Stock
                    </SecondaryFont>
                    <BodyText className={styles['pickup-location-card__inventory-value']}>
                      {maxStockLevel}
                    </BodyText>
                  </Box>
                )}

                {stockPercentage != null && (
                  <Box className={styles['pickup-location-card__inventory-item']}>
                    <SecondaryFont className={styles['pickup-location-card__inventory-label']}>
                      Stock Level
                    </SecondaryFont>
                    <Chip
                      label={`${stockPercentage}%`}
                      size="small"
                      color={stockPercentage > 50 ? 'success' : stockPercentage > 20 ? 'warning' : 'error'}
                      variant="outlined"
                      className={styles['pickup-location-card__inventory-chip']}
                    />
                  </Box>
                )}
              </Box>

              {formattedRestockDate && (
                <Box className={styles['pickup-location-card__restock']}>
                  <RefreshIcon fontSize="small" className={styles['pickup-location-card__restock-icon']} />
                  <SecondaryFont className={styles['pickup-location-card__restock-text']}>
                    Last restocked: {formattedRestockDate}
                  </SecondaryFont>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Address */}
        <Box className={styles['pickup-location-card__address']}>
          <SecondaryFont className={styles['pickup-location-card__address-label']}>
            Address:
          </SecondaryFont>
          {hasAddress ? (
            <Box component="div">
              {nameOnAddress != null && (
                <BodyText className={styles['pickup-location-card__name']}>{nameOnAddress}</BodyText>
              )}
              {streetAddress != null && <BodyText variant="body2">{streetAddress}</BodyText>}
              {streetAddress2 != null && <BodyText variant="body2">{streetAddress2}</BodyText>}
              {streetAddress3 != null && <BodyText variant="body2">{streetAddress3}</BodyText>}
              {(city != null || state != null) && (
                <BodyText variant="body2">
                  {city}
                  {city && state && ', '}
                  {state} {postalCode ?? ''}
                </BodyText>
              )}
              {country != null && <BodyText variant="body2">{country}</BodyText>}
            </Box>
          ) : (
            <SecondaryFont className={styles['pickup-location-card__no-address']}>
              Address information not available
            </SecondaryFont>
          )}
        </Box>

        {/* Contact Info */}
        {(phoneOnAddress != null || emailOnAddress != null) && (
          <Box className={styles['pickup-location-card__contact']}>
            {phoneOnAddress != null && (
              <Box className={styles['pickup-location-card__contact-row']}>
                <PhoneIcon fontSize="small" className={styles['pickup-location-card__contact-icon']} />
                <BodyText
                  variant="body2"
                  component="a"
                  {...({ href: `tel:${phoneOnAddress}` } as React.ComponentProps<typeof BodyText>)}
                  className={styles['pickup-location-card__contact-link']}
                >
                  {phoneOnAddress}
                </BodyText>
              </Box>
            )}
            {emailOnAddress != null && (
              <Box className={styles['pickup-location-card__contact-row']}>
                <EmailIcon fontSize="small" className={styles['pickup-location-card__contact-icon']} />
                <BodyText
                  variant="body2"
                  component="a"
                  {...({ href: `mailto:${emailOnAddress}` } as React.ComponentProps<typeof BodyText>)}
                  className={styles['pickup-location-card__contact-link']}
                >
                  {emailOnAddress}
                </BodyText>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default PickupLocationCard
