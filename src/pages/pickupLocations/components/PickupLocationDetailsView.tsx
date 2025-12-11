import { Box, Divider, Grid, Paper } from '@mui/material'

import { BodyText, Subheader } from '../../../components/fonts'
import AddressDetailsView from '../../../components/form/AddressDetailsView'
import styles from '../../../styles/Users.module.scss'

interface PickupLocationDetailsViewProps {
  addressNickName: string
  shipRocketPickupLocationId?: number | null
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
      <Paper className={styles['add-users-page__section']}>
        <Subheader label="Location Information" className={styles['add-users-page__section-title']} />
        <Divider className={styles['add-users-page__divider']} />
        <Box className={styles['add-users-page__divider-spacer']} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Location Name</BodyText>
              <BodyText className={styles['user-details-view__value']}>{addressNickName || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Shiprocket ID</BodyText>
              <BodyText className={styles['user-details-view__value']}>
                {shipRocketPickupLocationId ?? '—'}
              </BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Address Details Section - using shared component */}
      <AddressDetailsView
        streetAddress={address.streetAddress}
        streetAddress2={address.streetAddress2}
        streetAddress3={address.streetAddress3}
        city={address.city}
        state={address.state}
        postalCode={address.postalCode}
        country={address.country}
        addressType={address.addressType}
        nameOnAddress={address.nameOnAddress}
        emailOnAddress={address.emailOnAddress}
        phoneOnAddress={address.phoneOnAddress}
      />

      {/* Notes Section */}
      {notes && (
        <Paper className={styles['add-users-page__section']}>
          <Subheader label="Notes" className={styles['add-users-page__section-title']} />
          <Divider className={styles['add-users-page__divider']} />
          <Box className={styles['add-users-page__divider-spacer']} />
          <BodyText className={styles['user-details-view__notes']}>{notes}</BodyText>
        </Paper>
      )}
    </>
  )
}

export default PickupLocationDetailsView
