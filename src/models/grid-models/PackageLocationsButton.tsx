import { useEffect, useState } from 'react'

import { Inventory as InventoryIcon } from '@mui/icons-material'
import { Badge, IconButton } from '@mui/material'

import { pickupLocationApi } from '../../api/pickupLocationApi'
import { PickupLocationsModal } from '../../pages/products/components'
import type { PickupLocationCardData } from '../../pages/products/components/PickupLocationCard'
import type { PackagePickupLocationMappingResponseModel } from '../api-models/PackageModels'

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

interface PackageLocationsButtonProps {
  /** Map of pickup location ID to inventory data */
  pickupLocationQuantities: Record<number, PackagePickupLocationMappingResponseModel>
  packageName?: string
}

/**
 * Component to display package locations button with modal
 * Shows inventory settings for packages at each pickup location
 * Reuses PickupLocationsModal from products components
 * Fetches full pickup location data (address, contact info) when modal opens
 */
const PackageLocationsButton = ({
  pickupLocationQuantities,
  packageName,
}: PackageLocationsButtonProps): React.JSX.Element => {
  const [open, setOpen] = useState(false)
  const [locations, setLocations] = useState<PickupLocationCardData[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpen = (): void => {
    setOpen(true)
  }
  const handleClose = (): void => {
    setOpen(false)
  }

  const locationCount = Object.keys(pickupLocationQuantities).length

  // Fetch full pickup location data when modal opens
  useEffect(() => {
    if (!open) return

    const fetchLocationData = async (): Promise<void> => {
      const locationIds = Object.keys(pickupLocationQuantities).map(Number)
      if (locationIds.length === 0) {
        setLocations([])
        return
      }

      setLoading(true)
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
          const inventoryData = pickupLocationQuantities[id]
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

        setLocations(locationCards)
      } catch {
        // Fallback to basic location data if fetch fails
        const fallbackCards: PickupLocationCardData[] = Object.entries(pickupLocationQuantities).map(
          ([id, inventoryData]) => ({
            pickupLocation: {
              pickupLocationId: Number(id),
              addressNickName: `Location ${id}`,
            },
            availableStock: inventoryData?.quantity ?? 0,
            reorderLevel: inventoryData?.reorderLevel,
            maxStockLevel: inventoryData?.maxStockLevel,
            lastRestockDate: inventoryData?.lastRestockDate,
          }),
        )
        setLocations(fallbackCards)
      } finally {
        setLoading(false)
      }
    }

    void fetchLocationData()
  }, [open, pickupLocationQuantities])

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        data-test-id="package-locations-button"
        sx={{
          '&:hover': {
            backgroundColor: 'primary.light',
            color: 'primary.contrastText',
          },
        }}
      >
        <Badge badgeContent={locationCount} color="primary">
          <InventoryIcon />
        </Badge>
      </IconButton>
      <PickupLocationsModal
        open={open}
        onClose={handleClose}
        locations={locations}
        productTitle={packageName}
        loading={loading}
      />
    </>
  )
}

export default PackageLocationsButton
