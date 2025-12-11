import type React from 'react'

import { Box, Chip, Divider, Paper } from '@mui/material'

import { BodyText, FieldLabel, SecondaryFont, Subheader } from '../../../components/fonts'
import styles from '../../../styles/Packages.module.scss'

interface PackageDetailsViewProps {
  packageName: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  packageType: string
  notes?: string
}

/**
 * PackageDetailsView Component
 * Displays package details in view mode (read-only)
 */
const PackageDetailsView = ({
  packageName,
  length,
  breadth,
  height,
  maxWeight,
  standardCapacity,
  pricePerUnit,
  packageType,
  notes,
}: PackageDetailsViewProps): React.JSX.Element => {
  const getPackageTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'FRAGILE':
        return 'error'
      case 'OVERSIZED':
        return 'warning'
      case 'ENVELOPE':
        return 'info'
      case 'BOX':
        return 'primary'
      case 'TUBE':
        return 'secondary'
      case 'CUSTOM':
        return 'default'
      default:
        return 'success'
    }
  }

  return (
    <>
      {/* Package Information Section */}
      <Paper className={styles['add-packages-page__section']}>
        <Subheader label="Package Information" className={styles['add-packages-page__section-title']} />
        <Divider className={styles['add-packages-page__divider']} />
        <Box className={styles['add-packages-page__divider-spacer']} />

        <Box className={styles['package-details-view__grid']}>
          {/* Package Name */}
          <Box className={styles['package-details-view__field']}>
            <FieldLabel>Package Name</FieldLabel>
            <BodyText>{packageName || '—'}</BodyText>
          </Box>

          {/* Package Type */}
          <Box className={styles['package-details-view__field']}>
            <FieldLabel>Package Type</FieldLabel>
            <Box>
              <Chip
                label={packageType || 'STANDARD'}
                color={getPackageTypeColor(packageType)}
                size="small"
              />
            </Box>
          </Box>

          {/* Dimensions */}
          <Box className={styles['package-details-view__field']}>
            <FieldLabel>Dimensions (L × W × H)</FieldLabel>
            <Box className={styles['package-details-view__dimensions']}>
              <BodyText className={styles['package-details-view__dimensions-value']}>
                {length} × {breadth} × {height}
              </BodyText>
              <SecondaryFont variant="caption" className={styles['package-details-view__dimensions-unit']}>
                cm
              </SecondaryFont>
            </Box>
          </Box>

          {/* Max Weight */}
          <Box className={styles['package-details-view__field']}>
            <FieldLabel>Max Weight</FieldLabel>
            <Box className={styles['package-details-view__dimensions']}>
              <BodyText className={styles['package-details-view__dimensions-value']}>
                {maxWeight}
              </BodyText>
              <SecondaryFont variant="caption" className={styles['package-details-view__dimensions-unit']}>
                kg
              </SecondaryFont>
            </Box>
          </Box>

          {/* Standard Capacity */}
          <Box className={styles['package-details-view__field']}>
            <FieldLabel>Standard Capacity</FieldLabel>
            <Box className={styles['package-details-view__dimensions']}>
              <BodyText className={styles['package-details-view__dimensions-value']}>
                {standardCapacity}
              </BodyText>
              <SecondaryFont variant="caption" className={styles['package-details-view__dimensions-unit']}>
                items
              </SecondaryFont>
            </Box>
          </Box>

          {/* Price Per Unit */}
          <Box className={styles['package-details-view__field']}>
            <FieldLabel>Price Per Unit</FieldLabel>
            <BodyText>₹{pricePerUnit.toFixed(2)}</BodyText>
          </Box>
        </Box>
      </Paper>

      {/* Notes Section */}
      {notes && (
        <Paper className={styles['add-packages-page__section']}>
          <Subheader label="Notes" className={styles['add-packages-page__section-title']} />
          <Divider className={styles['add-packages-page__divider']} />
          <Box className={styles['add-packages-page__divider-spacer']} />
          <BodyText className={styles['package-details-view__notes']}>{notes}</BodyText>
        </Paper>
      )}
    </>
  )
}

export default PackageDetailsView
