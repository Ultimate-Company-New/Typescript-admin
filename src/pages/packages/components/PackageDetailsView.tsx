import type React from 'react'
import { useEffect, useState } from 'react'

import { Box, Chip, Divider, Grid, Paper } from '@mui/material'

import { pickupLocationApi } from '../../../api/pickupLocationApi'
import { BodyText, FieldLabel, SecondaryFont, Subheader } from '../../../components/fonts'
import { type PackagePickupLocationMappingResponseModel } from '../../../models/api-models'
import PickupLocationCard, { type PickupLocationCardData } from '../../products/components/PickupLocationCard'
import styles from '../../../styles/Packages.module.scss'
import commonStyles from '../../../styles/common.module.scss'

interface PickupLocationApiData {
  pickupLocationId?: number
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

interface PackageDetailsViewProps {
  packageName: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  packageType: string
  pickupLocationQuantities?: Record<string, PackagePickupLocationMappingResponseModel>
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
  pickupLocationQuantities,
  notes,
}: PackageDetailsViewProps): React.JSX.Element => {
  // State for pickup locations
  const [pickupLocations, setPickupLocations] = useState<PickupLocationCardData[]>([])

  // Fetch pickup location data
  useEffect(() => {
    const fetchLocationData = async (): Promise<void> => {
      const quantities = pickupLocationQuantities || {}
      const locationIds = Object.keys(quantities).map(Number)
      if (locationIds.length === 0) {
        setPickupLocations([])
        return
      }

      try {
        const response = await pickupLocationApi.getPickupLocationsInBatches({
          start: 0,
          end: 100,
          pageSize: 100,
        })

        const allLocations = (response.data || []) as PickupLocationApiData[]

        // Create location cards with full inventory data for packages
        const locationCards: PickupLocationCardData[] = locationIds.map(id => {
          const locationData = allLocations.find(loc => loc.pickupLocationId === id)
          const inventoryData = quantities[id]
          const availableStock = inventoryData?.quantity ?? 0

          if (locationData) {
            return {
              pickupLocation: {
                pickupLocationId: id,
                addressNickName: locationData.addressNickName,
                address: locationData.address,
              },
              availableStock,
              // Package-specific inventory fields
              reorderLevel: inventoryData?.reorderLevel,
              maxStockLevel: inventoryData?.maxStockLevel,
              lastRestockDate: inventoryData?.lastRestockDate,
            }
          }
          // Fallback if location not found
          return {
            pickupLocation: {
              pickupLocationId: id,
              addressNickName: `Location ${id}`,
            },
            availableStock,
            reorderLevel: inventoryData?.reorderLevel,
            maxStockLevel: inventoryData?.maxStockLevel,
            lastRestockDate: inventoryData?.lastRestockDate,
          }
        })

        setPickupLocations(locationCards)
      } catch {
        // Fallback to basic location data if fetch fails
        const fallbackCards: PickupLocationCardData[] = locationIds.map(id => {
          const inventoryData = quantities[id]
          return {
            pickupLocation: {
              pickupLocationId: id,
              addressNickName: `Location ${id}`,
            },
            availableStock: inventoryData?.quantity ?? 0,
            reorderLevel: inventoryData?.reorderLevel,
            maxStockLevel: inventoryData?.maxStockLevel,
            lastRestockDate: inventoryData?.lastRestockDate,
          }
        })
        setPickupLocations(fallbackCards)
      }
    }

    void fetchLocationData()
  }, [pickupLocationQuantities])

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
            <BodyText data-test-id="package-view-package-name">{packageName || '—'}</BodyText>
          </Box>

          {/* Package Type */}
          <Box className={styles['package-details-view__field']}>
            <FieldLabel>Package Type</FieldLabel>
            <Box>
              <Chip
                data-test-id="package-view-package-type"
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
              <BodyText
                data-test-id="package-view-dimensions"
                className={styles['package-details-view__dimensions-value']}
              >
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
              <BodyText
                data-test-id="package-view-max-weight"
                className={styles['package-details-view__dimensions-value']}
              >
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
              <BodyText
                data-test-id="package-view-standard-capacity"
                className={styles['package-details-view__dimensions-value']}
              >
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
            <BodyText data-test-id="package-view-price-per-unit">₹{pricePerUnit.toFixed(2)}</BodyText>
          </Box>
        </Box>
      </Paper>

      {/* Stock & Pickup Locations Section */}
      {pickupLocations.length > 0 && (
        <Paper className={styles['add-packages-page__section']}>
          <Subheader label="Stock & Pickup Locations" className={styles['add-packages-page__section-title']} />
          <Divider className={styles['add-packages-page__divider']} />
          <Box className={styles['add-packages-page__divider-spacer']} />

          <Grid container spacing={2}>
            {pickupLocations.map((location, index) => (
              <Grid item xs={12} sm={6} key={location.pickupLocation?.pickupLocationId ?? index}>
                <PickupLocationCard location={location} index={index} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Notes Section */}
      {notes && (
        <Paper className={styles['add-packages-page__section']}>
          <Subheader label="Notes" className={styles['add-packages-page__section-title']} />
          <Divider className={styles['add-packages-page__divider']} />
          <Box className={styles['add-packages-page__divider-spacer']} />
          <FieldLabel>Additional Notes</FieldLabel>
          <Box className={commonStyles['view-notes__container']}>
            <BodyText data-test-id="package-view-notes" className={commonStyles['view-notes__text']}>
              {notes}
            </BodyText>
          </Box>
        </Paper>
      )}
    </>
  )
}

export default PackageDetailsView
