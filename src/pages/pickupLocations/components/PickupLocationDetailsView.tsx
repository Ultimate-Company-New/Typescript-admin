import { Box, Grid, Paper } from '@mui/material'

import { BodyText, FieldLabel, Subheader } from '../../../components/fonts'
import styles from '../../../styles/PickupLocations.module.scss'

interface PickupLocationDetailsViewProps {
  addressNickName: string
  shipRocketPickupLocationId?: string
  address: {
    streetAddress: string
    streetAddress2?: string
    streetAddress3?: string
    city: string
    state: string
    postalCode: string
    country: string
    addressType: string
    nameOnAddress?: string
    emailOnAddress?: string
    phoneOnAddress?: string
  }
  notes?: string
}

/**
 * Pickup Location Details View Component
 * Displays pickup location information in read-only format
 */
const PickupLocationDetailsView = ({
  addressNickName,
  shipRocketPickupLocationId,
  address,
  notes,
}: PickupLocationDetailsViewProps): JSX.Element => {
  return (
    <>
      {/* Location Information Section */}
      <Paper className={styles['pickup-location-details-view__section']}>
        <Subheader
          label="Location Information"
          className={styles['pickup-location-details-view__section-title']}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Location Name
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {addressNickName || '—'}
            </BodyText>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              ShipRocket Pickup Location ID
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {shipRocketPickupLocationId || '—'}
            </BodyText>
          </Grid>
        </Grid>
      </Paper>

      {/* Address Details Section */}
      <Paper className={styles['pickup-location-details-view__section']}>
        <Subheader
          label="Address Details"
          className={styles['pickup-location-details-view__section-title']}
        />
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Street Address
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.streetAddress || '—'}
            </BodyText>
          </Grid>
          {address.streetAddress2 && (
            <Grid item xs={12} sm={6}>
              <FieldLabel className={styles['pickup-location-details-view__label']}>
                Street Address 2
              </FieldLabel>
              <BodyText className={styles['pickup-location-details-view__value']}>
                {address.streetAddress2}
              </BodyText>
            </Grid>
          )}
          {address.streetAddress3 && (
            <Grid item xs={12} sm={6}>
              <FieldLabel className={styles['pickup-location-details-view__label']}>
                Street Address 3
              </FieldLabel>
              <BodyText className={styles['pickup-location-details-view__value']}>
                {address.streetAddress3}
              </BodyText>
            </Grid>
          )}
          <Grid item xs={12} sm={4}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              City
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.city || '—'}
            </BodyText>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              State
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.state || '—'}
            </BodyText>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Postal Code
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.postalCode || '—'}
            </BodyText>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Country
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.country || '—'}
            </BodyText>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Address Type
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.addressType || '—'}
            </BodyText>
          </Grid>
        </Grid>
      </Paper>

      {/* Contact Information Section */}
      <Paper className={styles['pickup-location-details-view__section']}>
        <Subheader
          label="Contact Information"
          className={styles['pickup-location-details-view__section-title']}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Name on Address
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.nameOnAddress || '—'}
            </BodyText>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Email on Address
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.emailOnAddress || '—'}
            </BodyText>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FieldLabel className={styles['pickup-location-details-view__label']}>
              Phone on Address
            </FieldLabel>
            <BodyText className={styles['pickup-location-details-view__value']}>
              {address.phoneOnAddress || '—'}
            </BodyText>
          </Grid>
        </Grid>
      </Paper>

      {/* Notes Section */}
      {notes && (
        <Paper className={styles['pickup-location-details-view__section']}>
          <Subheader
            label="Notes"
            className={styles['pickup-location-details-view__section-title']}
          />
          <Box className={styles['pickup-location-details-view__notes']}>
            <BodyText>{notes}</BodyText>
          </Box>
        </Paper>
      )}
    </>
  )
}

export default PickupLocationDetailsView

