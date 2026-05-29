import { Box, Divider, Grid, Paper } from '@mui/material'

import userStyles from '../../styles/Users.module.scss'
import { BodyText, FieldLabel, Subheader } from '../fonts'

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
  /** Prefix for data-test-id attributes (default: user-view-address). */
  testIdPrefix?: string
  sectionClassName?: string
  sectionTitleClassName?: string
  dividerClassName?: string
  dividerSpacerClassName?: string
  fieldClassName?: string
  valueClassName?: string
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
  testIdPrefix = 'user-view-address',
  sectionClassName = userStyles['add-users-page__section'],
  sectionTitleClassName = userStyles['add-users-page__section-title'],
  dividerClassName = userStyles['add-users-page__divider'],
  dividerSpacerClassName = userStyles['add-users-page__divider-spacer'],
  fieldClassName = userStyles['user-details-view__field'],
  valueClassName = userStyles['user-details-view__value'],
}: AddressDetailsViewProps): JSX.Element => {
  const formatPhone = (phoneNumber: string | undefined): string => {
    if (!phoneNumber) return '—'
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phoneNumber
  }

  return (
    <Paper className={sectionClassName}>
      <Subheader label="Address Details" className={sectionTitleClassName} />
      <Divider className={dividerClassName} />
      <Box className={dividerSpacerClassName} />

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>Address Type</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-type`} className={valueClassName}>
              {addressType || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>Name on Address</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-name`} className={valueClassName}>
              {nameOnAddress || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box className={fieldClassName}>
            <FieldLabel>Street Address</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-street`} className={valueClassName}>
              {streetAddress || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box className={fieldClassName}>
            <FieldLabel>Street Address 2</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-street2`} className={valueClassName}>
              {streetAddress2?.trim() ? streetAddress2 : '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box className={fieldClassName}>
            <FieldLabel>Street Address 3</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-street3`} className={valueClassName}>
              {streetAddress3?.trim() ? streetAddress3 : '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>State</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-state`} className={valueClassName}>
              {state || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>City</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-city`} className={valueClassName}>
              {city || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>Postal Code</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-postal-code`} className={valueClassName}>
              {postalCode || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>Country</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-country`} className={valueClassName}>
              {country || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>Email on Address</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-email`} className={valueClassName}>
              {emailOnAddress || '—'}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className={fieldClassName}>
            <FieldLabel>Phone on Address</FieldLabel>
            <BodyText data-test-id={`${testIdPrefix}-phone`} className={valueClassName}>
              {formatPhone(phoneOnAddress)}
            </BodyText>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AddressDetailsView
