import type React from 'react'

import { Box, Divider, Grid, Paper } from '@mui/material'

import { BodyText, Subheader } from '../../../components/fonts'
import styles from '../../../styles/Promos.module.scss'
import type { PromoFormData } from '../../../utils/validationSchemas'

interface PromoDetailsViewProps {
  watchedValues: PromoFormData
}

/**
 * Promo Details View Component
 * Read-only display of promo information with proper section formatting
 */
const PromoDetailsView = ({ watchedValues }: PromoDetailsViewProps): React.JSX.Element => {
  /**
   * Format currency value
   */
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '—'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value)
  }

  /**
   * Format discount display based on type
   */
  const formatDiscount = (): string => {
    const value = watchedValues.discountValue
    if (value === undefined || value === null) return '—'

    if (watchedValues.isPercent) {
      return `${value}%`
    }
    return formatCurrency(value)
  }

  /**
   * Get promo type badge class
   */
  const getPromoBadgeClass = (): string =>
    watchedValues.isPercent
      ? styles['promo-details-view__badge--percent']
      : styles['promo-details-view__badge--fixed']

  /**
   * Format date value
   */
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  return (
    <>
      {/* Promo Details Section */}
      <Paper className={styles['add-promos-page__section']}>
        <Subheader label="Promo Details" className={styles['add-promos-page__section-title']} />
        <Divider className={styles['add-promos-page__divider']} />
        <Box className={styles['add-promos-page__divider-spacer']} />

        <Grid container spacing={3}>
          {/* Promo Code */}
          <Grid item xs={12} sm={6}>
            <Box className={styles['promo-details-view__field']}>
              <BodyText className={styles['promo-details-view__label']}>Promo Code</BodyText>
              <BodyText className={styles['promo-details-view__value']}>
                {watchedValues.promoCode?.toUpperCase() ?? '—'}
              </BodyText>
            </Box>
          </Grid>

          {/* Discount Value */}
          <Grid item xs={12} sm={6}>
            <Box className={styles['promo-details-view__field']}>
              <BodyText className={styles['promo-details-view__label']}>Discount Value</BodyText>
              <BodyText className={styles['promo-details-view__value']}>{formatDiscount()}</BodyText>
            </Box>
          </Grid>

          {/* Discount Type */}
          <Grid item xs={12} sm={6}>
            <Box className={styles['promo-details-view__field']}>
              <BodyText className={styles['promo-details-view__label']}>Discount Type</BodyText>
              <Box>
                <span className={`${styles['promo-details-view__badge']} ${getPromoBadgeClass()}`}>
                  {watchedValues.isPercent ? 'Percentage' : 'Fixed Amount'}
                </span>
              </Box>
            </Box>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={6}>
            <Box className={styles['promo-details-view__field']}>
              <BodyText className={styles['promo-details-view__label']}>Start Date</BodyText>
              <BodyText className={styles['promo-details-view__value']}>{formatDate(watchedValues.startDate)}</BodyText>
            </Box>
          </Grid>

          {/* Expiry Date */}
          <Grid item xs={12} sm={6}>
            <Box className={styles['promo-details-view__field']}>
              <BodyText className={styles['promo-details-view__label']}>Expiry Date</BodyText>
              <BodyText className={styles['promo-details-view__value']}>{formatDate(watchedValues.expiryDate)}</BodyText>
            </Box>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Box className={styles['promo-details-view__field']}>
              <BodyText className={styles['promo-details-view__label']}>Description</BodyText>
              <BodyText className={styles['promo-details-view__value']}>
                {watchedValues.description ?? '—'}
              </BodyText>
            </Box>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Box className={styles['promo-details-view__field']}>
              <BodyText className={styles['promo-details-view__label']}>Notes</BodyText>
              <BodyText className={styles['promo-details-view__value']}>
                {watchedValues.notes || '—'}
              </BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default PromoDetailsView
