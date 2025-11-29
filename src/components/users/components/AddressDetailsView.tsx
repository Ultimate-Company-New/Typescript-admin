import { Box, Divider, Grid, Paper } from '@mui/material'

import styles from '../../../pages/users/Users.module.scss'
import { BodyText, Subheader } from '../../fonts'

interface AddressDetailsViewProps {
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

/**
 * Read-only view component for displaying address details
 * Used in view mode to show address information in a clean, non-editable format
 */
const AddressDetailsView = ({
  streetAddress,
  streetAddress2,
  streetAddress3,
  city,
  state,
  postalCode,
  country,
  addressType,
  nameOnAddress,
  emailOnAddress,
  phoneOnAddress,
}: AddressDetailsViewProps): JSX.Element => {
  const formatPhone = (phoneNumber: string | undefined): string => {
    if (!phoneNumber) return '—'
    // Format as (XXX) XXX-XXXX
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phoneNumber
  }

  return (
    <Paper className={styles['add-users-page__section']}>
      <Subheader label="Address Details" className={styles['add-users-page__section-title']} />
      <Divider className={styles['add-users-page__divider']} />
      <Box className={styles['add-users-page__divider-spacer']} />

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Box className={styles['user-details-view__field']}>
            <BodyText className={styles['user-details-view__label']}>Address Type</BodyText>
            <BodyText className={styles['user-details-view__value']}>{addressType || '—'}</BodyText>
          </Box>
        </Grid>

        {nameOnAddress && (
          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Name on Address</BodyText>
              <BodyText className={styles['user-details-view__value']}>{nameOnAddress}</BodyText>
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box className={styles['user-details-view__field']}>
            <BodyText className={styles['user-details-view__label']}>Street Address</BodyText>
            <BodyText className={styles['user-details-view__value']}>{streetAddress || '—'}</BodyText>
          </Box>
        </Grid>

        {streetAddress2 && (
          <Grid item xs={12}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Street Address 2</BodyText>
              <BodyText className={styles['user-details-view__value']}>{streetAddress2}</BodyText>
            </Box>
          </Grid>
        )}

        {streetAddress3 && (
          <Grid item xs={12}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Street Address 3</BodyText>
              <BodyText className={styles['user-details-view__value']}>{streetAddress3}</BodyText>
            </Box>
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <Box className={styles['user-details-view__field']}>
            <BodyText className={styles['user-details-view__label']}>State</BodyText>
            <BodyText className={styles['user-details-view__value']}>{state || '—'}</BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={styles['user-details-view__field']}>
            <BodyText className={styles['user-details-view__label']}>City</BodyText>
            <BodyText className={styles['user-details-view__value']}>{city || '—'}</BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={styles['user-details-view__field']}>
            <BodyText className={styles['user-details-view__label']}>Postal Code</BodyText>
            <BodyText className={styles['user-details-view__value']}>{postalCode || '—'}</BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={styles['user-details-view__field']}>
            <BodyText className={styles['user-details-view__label']}>Country</BodyText>
            <BodyText className={styles['user-details-view__value']}>{country || '—'}</BodyText>
          </Box>
        </Grid>

        {emailOnAddress && (
          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Email on Address</BodyText>
              <BodyText className={styles['user-details-view__value']}>{emailOnAddress}</BodyText>
            </Box>
          </Grid>
        )}

        {phoneOnAddress && (
          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Phone on Address</BodyText>
              <BodyText className={styles['user-details-view__value']}>{formatPhone(phoneOnAddress)}</BodyText>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  )
}

export default AddressDetailsView
