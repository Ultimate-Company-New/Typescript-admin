import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import { Box, Card, CardContent, Chip } from '@mui/material'

import { BodyText, SecondaryFont } from '../../../components/fonts'
import styles from '../../../styles/Products.module.scss'

/**
 * Pickup location data structure supporting multiple API response formats
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
 * Reusable card component to display pickup location details
 * Used in PickupLocationsModal and ProductDetailsView
 */
const PickupLocationCard = ({ location: item, index = 0 }: PickupLocationCardProps): JSX.Element => {
  // Extract data from ProductPickupLocationItem structure
  const location = item.pickupLocation ?? item
  const { availableStock } = item
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

  return (
    <Card
      variant="outlined"
      className={styles['pickup-location-card']}
      key={locationId ?? index}
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
              color={availableStock > 0 ? 'success' : 'error'}
              className={styles['pickup-location-card__stock-chip']}
            />
          </Box>
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
                  href={`tel:${phoneOnAddress}`}
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
                  href={`mailto:${emailOnAddress}`}
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
